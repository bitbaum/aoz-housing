# Witikon Housing Complex - Complete Setup

**Created**: 2026-01-24
**Purpose**: Demonstration of complete AOZ Housing workflow with compatibility matching

---

## 🏗️ Structure

### Building: Witikon
### Apartment: WITIKON-440
**Address**: Witikonerstrasse 440, 8053 Zürich
**Total Capacity**: 4 rooms, 8 beds

| Room | Beds | Size | Floor |
|------|------|------|-------|
| R1 | 2 | 16m² | 4 |
| R2 | 2 | 14m² | 4 |
| R3 | 3 | 20m² | 4 |
| R4 | 1 | 10m² | 4 |

---

## 👥 Residents (8 total)

Created using `/scripts/create-witikon-residents.ts`

### Compatibility Profiles

| Code | Name | Sleep | Social | Clean | Noise | Privacy | Languages | Diet |
|------|------|-------|--------|-------|-------|---------|-----------|------|
| WIT-001 | Ahmed Hassan | Early bird | Introverted | 5 (very clean) | 1 (low tolerance) | 5 (high) | AR, EN | Halal |
| WIT-002 | Maria Rodriguez | Night owl | Extroverted | 3 (average) | 5 (high tolerance) | 1 (low) | ES, EN | Vegetarian |
| WIT-003 | Dmitri Volkov | Irregular | Moderate | 4 (clean) | 3 (medium) | 3 (medium) | RU | Regular |
| WIT-004 | Amina Osman | Early bird | Introverted | 5 (very clean) | 1 (low tolerance) | 5 (high) | SO | Halal |
| WIT-005 | Carlos Silva | Night owl | Extroverted | 2 (messy) | 5 (high tolerance) | 1 (low) | PT | Regular |
| WIT-006 | Fatima Al-Rashid | Irregular | Moderate | 4 (clean) | 3 (medium) | 3 (medium) | AR | Halal |
| WIT-007 | John O'Brien | Early bird | Moderate | 4 (clean) | 2 (low) | 3 (medium) | EN | Regular |
| WIT-008 | Yuki Tanaka | Early bird | Introverted | 5 (very clean) | 1 (low tolerance) | 5 (high) | JA, EN | Regular |

---

## 🎯 Expected Compatibility Patterns

### High Compatibility (80%+)
- **Ahmed + Amina + Yuki**: All early birds, introverted, very clean, need quiet
- Share sleep schedule, cleanliness standards, privacy needs
- Language overlap: Ahmed & Amina (AR), Ahmed & Yuki (EN)

### Medium Compatibility (50-79%)
- **Dmitri + Fatima + John**: Moderate personalities, clean, irregular schedules
- **Maria + Carlos**: Both night owls, social, high noise tolerance

### Low Compatibility (<50%)
- **Ahmed ↔ Carlos**: Early bird vs night owl, clean vs messy, quiet vs party
- **Amina ↔ Maria**: Introverted vs extroverted, high privacy vs low privacy
- **Yuki ↔ Carlos**: Need quiet vs loud, very clean vs messy

---

## ✅ Testing Compatibility Matching

1. **Visit**: http://localhost:3000/matching
2. **Select**: Ahmed (WIT-001)
3. **Expect to see**:
   - ✅ High scores for Amina, Yuki (similar profiles)
   - ⚠️ Medium scores for John, Dmitri, Fatima
   - ❌ Low scores for Maria, Carlos (opposite profiles)

4. **Select**: Maria (WIT-002)
5. **Expect to see**:
   - ✅ High score for Carlos (both night owls, social)
   - ⚠️ Medium scores for moderate personalities
   - ❌ Low scores for quiet early birds

---

## 📊 Diversity Metrics

| Dimension | Distribution |
|-----------|-------------|
| Sleep Schedule | 4 Early birds, 2 Night owls, 2 Irregular |
| Social Style | 3 Introverted, 3 Moderate, 2 Extroverted |
| Cleanliness | 3 Very clean (5), 3 Clean (4), 1 Average (3), 1 Messy (2) |
| Noise Tolerance | 4 Low (1-2), 2 Medium (3), 2 High (5) |
| Privacy Need | 3 High (5), 3 Medium (3), 2 Low (1) |
| Languages | 8 unique (AR, ES, RU, SO, PT, EN, JA, FR) |
| Dietary Needs | 3 Halal, 1 Vegetarian, 4 Regular |

---

## 🔄 Next Steps: Placement

1. Use `/matching` to find compatible residents
2. Place compatible groups in same rooms:
   - **R3 (3 beds)**: Ahmed, Amina, Yuki (all quiet early birds)
   - **R1 (2 beds)**: Maria, Carlos (both social night owls)
   - **R2 (2 beds)**: Dmitri, Fatima (moderate, irregular)
   - **R4 (1 bed)**: John (single room)

3. Monitor harmony scores on housing unit page
4. Track incidents to identify any conflicts
5. Adjust placements based on real compatibility data

---

## 🛠️ How to Recreate

```bash
# Create residents
npx tsx scripts/create-witikon-residents.ts

# View results
open http://localhost:3000/housing
open http://localhost:3000/residents
open http://localhost:3000/matching
```

---

## 📝 Notes

- All data follows CLAUDE.md best practices (SSOT, DRY, SOC)
- Residents have realistic, diverse characteristics
- Compatibility algorithm considers: lifestyle, social, practical, and risk factors
- System designed to reduce conflicts and improve wellbeing

**Created with**: Claude Sonnet 4.5
