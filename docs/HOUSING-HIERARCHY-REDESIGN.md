# Housing Hierarchy Redesign

## Problem Analysis

### Current Model (Flat)
```
HousingUnit
  - totalBeds: 4
  - totalRooms: 2
  - privateRooms: 0
  - sharedRooms: 2
```

**Issues:**
1. Can't track individual beds - only aggregates
2. Can't place someone in a specific bed
3. No hierarchy (Building → Apartment → Room → Bed)
4. No eligibility system (medical docs for private placement)
5. Compatibility calculated at unit level, not roommate level

### Real-World Hierarchy (Zurich AOZ)
```
Building (Gebäude)
  └── Apartment/Unit (Wohnung)
        ├── Room 1 (Zimmer) - 12m² = 3 beds
        │     ├── Bed A
        │     ├── Bed B
        │     └── Bed C
        └── Room 2 (Zimmer) - 8m² = 2 beds
              ├── Bed A
              └── Bed B

Studio (separate)
  └── Self-contained unit with bathroom, kitchen
```

### Placement Types
| Type | Description | Requirements |
|------|-------------|--------------|
| BED | Spot in shared room | Default (no docs) |
| PRIVATE_ROOM | Single occupancy room | Medical documentation |
| STUDIO | Self-contained apartment | Medical documentation |

---

## Proposed Solution

### Option A: Full Hierarchy (4 tables)
```
Building → Apartment → Room → Bed
```
- Most accurate but complex
- Many joins for queries
- Harder to manage

### Option B: Two-Level Hierarchy (Recommended)
```
HousingUnit (location) → PlacementSpot (assignable spot)
```
- HousingUnit = Address/Building level
- PlacementSpot = What you actually assign (bed, room, or studio)
- Self-referencing hierarchy within PlacementSpot for room→bed relationship

---

## Schema Changes

### 1. New PlacementSpot Model
```prisma
model PlacementSpot {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Location
  housingUnitId String
  housingUnit   HousingUnit @relation(fields: [housingUnitId], references: [id])

  // Identification
  code          String   // "R1-B1", "R2", "STUDIO-A"
  label         String?  // Human-friendly name

  // Type determines what this spot is
  type          SpotType

  // Hierarchy (for beds within rooms)
  parentSpotId  String?
  parentSpot    PlacementSpot? @relation("SpotHierarchy", fields: [parentSpotId], references: [id])
  childSpots    PlacementSpot[] @relation("SpotHierarchy")

  // Physical attributes
  squareMeters  Float?
  floor         Int?

  // Facilities (mainly for PRIVATE_ROOM and STUDIO)
  hasPrivateBathroom Boolean @default(false)
  hasPrivateKitchen  Boolean @default(false)
  hasPrivateToilet   Boolean @default(false)

  // Capacity (beds per room, or 1 for single spots)
  capacity      Int @default(1)

  // Eligibility
  requiresMedicalDocs Boolean @default(false)

  // Status
  status        SpotStatus @default(AVAILABLE)
  notes         String?

  // Relations
  placements    Placement[]

  @@unique([housingUnitId, code])
  @@index([type, status])
  @@index([requiresMedicalDocs])
}

enum SpotType {
  BED           // Individual bed in shared room
  PRIVATE_ROOM  // Single-occupancy room (medical)
  STUDIO        // Self-contained unit (medical)
  ROOM          // Container for beds (not directly assignable)
}

enum SpotStatus {
  AVAILABLE     // Can be assigned
  OCCUPIED      // Currently has placement
  MAINTENANCE   // Temporarily unavailable
  CLOSED        // Permanently unavailable
}
```

### 2. Update Resident Model
```prisma
model Resident {
  // ... existing fields ...

  // Medical documentation for private placement eligibility
  hasMedicalDocumentation Boolean @default(false)
  medicalDocType          MedicalDocType?
  medicalDocDate          DateTime?
  medicalDocNotes         String?
}

enum MedicalDocType {
  PRIVATE_ROOM    // Qualifies for single room
  STUDIO          // Qualifies for studio/apartment
  BOTH            // Qualifies for either
}
```

### 3. Update Placement Model
```prisma
model Placement {
  // ... existing fields ...

  // Change: Link to spot instead of unit
  spotId        String
  spot          PlacementSpot @relation(fields: [spotId], references: [id])

  // Keep housingUnitId for convenience (denormalized)
  housingUnitId String
  housingUnit   HousingUnit @relation(fields: [housingUnitId], references: [id])
}
```

### 4. Simplify HousingUnit
```prisma
model HousingUnit {
  // Keep as location/building level
  id        String   @id @default(cuid())
  code      String   @unique // ZH-001
  address   String

  // Remove: totalBeds, totalRooms (calculated from spots)
  // Keep: Building-level attributes
  groundFloor       Boolean @default(false)
  wheelchairAccess  Boolean @default(false)
  elevator          Boolean @default(false)
  smokingAllowed    Boolean @default(false)
  petsAllowed       Boolean @default(false)
  quietHours        String?
  nearPublicTransport Boolean @default(true)
  nearHealthServices  Boolean @default(false)
  nearSchools         Boolean @default(false)

  status    HousingStatus @default(AVAILABLE)
  notes     String?

  // Relations
  spots       PlacementSpot[]
  placements  Placement[]
  incidents   Incident[]
}
```

---

## Config-Driven Setup

### lib/config/placement-spots.ts
```typescript
export const SPOT_TYPE_CONFIG = {
  BED: {
    id: 'BED',
    label: 'Bett (geteiltes Zimmer)',
    labelShort: 'Bett',
    icon: '🛏️',
    requiresMedicalDocs: false,
    isDefault: true,
    description: 'Schlafplatz in einem geteilten Zimmer',
  },
  PRIVATE_ROOM: {
    id: 'PRIVATE_ROOM',
    label: 'Einzelzimmer',
    labelShort: 'Zimmer',
    icon: '🚪',
    requiresMedicalDocs: true,
    isDefault: false,
    description: 'Eigenes Zimmer, geteilte Nasszellen',
  },
  STUDIO: {
    id: 'STUDIO',
    label: 'Studio/Apartment',
    labelShort: 'Studio',
    icon: '🏠',
    requiresMedicalDocs: true,
    isDefault: false,
    description: 'Eigene Wohnung mit Bad und Küche',
  },
  ROOM: {
    id: 'ROOM',
    label: 'Zimmer (Container)',
    labelShort: 'Zimmer',
    icon: '📦',
    requiresMedicalDocs: false,
    isDefault: false,
    description: 'Container für Betten (nicht direkt zuweisbar)',
    isContainer: true,
  },
};

// Capacity calculation from square meters (Swiss standards)
export const CAPACITY_CONFIG = {
  MIN_SQM_PER_BED: 4,
  RECOMMENDED_SQM_PER_BED: 6,
  calculateBedCapacity: (sqm: number): number => {
    return Math.floor(sqm / CAPACITY_CONFIG.MIN_SQM_PER_BED);
  },
};
```

---

## Matching Logic Changes

### Current (Broken)
```typescript
// Matches resident to UNIT, ignores actual bed availability
const availableUnits = await prisma.housingUnit.findMany({
  where: { status: 'AVAILABLE' }
});
```

### New (Correct)
```typescript
async function findAvailableSpots(resident: Resident) {
  // Determine eligibility
  const eligibleTypes: SpotType[] = ['BED'];

  if (resident.hasMedicalDocumentation) {
    if (resident.medicalDocType === 'PRIVATE_ROOM' || resident.medicalDocType === 'BOTH') {
      eligibleTypes.push('PRIVATE_ROOM');
    }
    if (resident.medicalDocType === 'STUDIO' || resident.medicalDocType === 'BOTH') {
      eligibleTypes.push('STUDIO');
    }
  }

  // Find available spots of eligible types
  const spots = await prisma.placementSpot.findMany({
    where: {
      type: { in: eligibleTypes },
      status: 'AVAILABLE',
      placements: { none: { status: 'ACTIVE' } },
    },
    include: {
      housingUnit: true,
      parentSpot: true, // To show room info for beds
    },
  });

  return spots;
}
```

---

## UI Changes

### 1. Housing Unit Detail Page
Show hierarchy:
```
ZH-001 - Langstrasse 42
├── Zimmer 1 (12m², 3 Betten)
│   ├── 🛏️ Bett A - Besetzt (RES-003)
│   ├── 🛏️ Bett B - Frei
│   └── 🛏️ Bett C - Besetzt (RES-007)
├── Zimmer 2 (8m², 2 Betten)
│   ├── 🛏️ Bett A - Frei
│   └── 🛏️ Bett B - Frei
└── 🚪 Einzelzimmer (med.) - Frei
```

### 2. Matching Page
Show eligible spots based on resident's medical status:
- Default: Show only available beds
- With medical docs: Show beds + private rooms + studios

### 3. Placement Flow
1. Select resident
2. System shows eligible spots based on medical docs
3. Select specific bed/room/studio
4. Confirm placement

### 4. Transfer Flow (Moving Resident)
1. Click "Verlegen" on resident
2. See current spot
3. See available spots (filtered by eligibility)
4. Select new spot
5. System ends old placement, creates new one

---

## Migration Strategy

### Phase 1: Add New Tables (Non-Breaking)
1. Create PlacementSpot model
2. Keep existing HousingUnit and Placement working
3. Add hasMedicalDocumentation to Resident

### Phase 2: Populate PlacementSpot Data
1. Create migration script
2. For each HousingUnit:
   - Create ROOM spots based on totalRooms
   - Create BED spots based on totalBeds
   - Link beds to rooms

### Phase 3: Update Placement to Use Spots
1. Add spotId to Placement (nullable initially)
2. Migrate existing placements to spots
3. Make spotId required

### Phase 4: Clean Up
1. Remove deprecated fields from HousingUnit (totalBeds, etc.)
2. Update all UI to use spots
3. Remove old computed capacity logic

---

## Benefits

1. **Accurate Inventory**: Track individual beds, not just totals
2. **Eligibility System**: Medical docs unlock private options
3. **Better Matching**: Place in specific spots, not just units
4. **Easy Transfers**: Move resident from spot to spot
5. **Real Compatibility**: Calculate between actual roommates (same room)
6. **Audit Trail**: Know exactly which bed someone was in

---

## Example Queries

### Available beds for default resident
```typescript
const beds = await prisma.placementSpot.findMany({
  where: {
    type: 'BED',
    status: 'AVAILABLE',
    placements: { none: { status: 'ACTIVE' } },
  },
});
```

### Roommates in same room
```typescript
const roommates = await prisma.placement.findMany({
  where: {
    status: 'ACTIVE',
    spot: {
      parentSpotId: currentBed.parentSpotId, // Same room
    },
  },
  include: { resident: true },
});
```

### Unit occupancy (calculated)
```typescript
const unit = await prisma.housingUnit.findUnique({
  where: { id },
  include: {
    spots: {
      where: { type: { in: ['BED', 'PRIVATE_ROOM', 'STUDIO'] } },
      include: {
        placements: { where: { status: 'ACTIVE' } },
      },
    },
  },
});

const totalSpots = unit.spots.length;
const occupied = unit.spots.filter(s => s.placements.length > 0).length;
```
