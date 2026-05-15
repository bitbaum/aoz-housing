'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { ACTIVITIES, ACTIVITY_CATEGORIES, type ActivityCategory } from '@/lib/config/activities'

const COST_BADGE: Record<string, { label: string; class: string }> = {
  free:    { label: PORTAL_LABELS.activities.costFree,    class: 'badge-active' },
  reduced: { label: PORTAL_LABELS.activities.costReduced, class: 'badge-pending' },
  paid:    { label: PORTAL_LABELS.activities.costPaid,    class: 'badge-info' },
}

export default function ActivitiesPage() {
  const [activeCategory, setActiveCategory] = useState<ActivityCategory | 'all'>('all')

  const filtered = activeCategory === 'all'
    ? ACTIVITIES
    : ACTIVITIES.filter(a => a.category === activeCategory)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/portal" className="text-aoz-primary hover:underline text-sm">
          {PORTAL_LABELS.form.back}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
          {PORTAL_LABELS.pages.activities}
        </h1>
        <p className="text-gray-500">{PORTAL_LABELS.pages.activitiesSubtitle}</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <CategoryChip
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        >
          {PORTAL_LABELS.activities.allCategories}
        </CategoryChip>
        {(Object.keys(ACTIVITY_CATEGORIES) as ActivityCategory[]).map(cat => (
          <CategoryChip
            key={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          >
            {ACTIVITY_CATEGORIES[cat].icon} {ACTIVITY_CATEGORIES[cat].label}
          </CategoryChip>
        ))}
      </div>

      {/* Activities list */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-12">{PORTAL_LABELS.activities.noResults}</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(activity => (
            <div key={activity.id} className="card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">{ACTIVITY_CATEGORIES[activity.category].icon}</span>
                  <h2 className="font-semibold text-gray-900">{activity.title}</h2>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${COST_BADGE[activity.cost].class}`}>
                    {COST_BADGE[activity.cost].label}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-2">{activity.description}</p>

              {activity.costNote && (
                <p className="text-xs text-gray-500 mt-1 italic">{activity.costNote}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {activity.location && (
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true">📍</span> {activity.location}
                  </span>
                )}
                {activity.schedule && (
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true">🕐</span> {activity.schedule}
                  </span>
                )}
              </div>

              {(activity.website || activity.phone) && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {activity.website && (
                    <a
                      href={activity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-aoz-primary hover:underline flex items-center gap-1"
                    >
                      <span aria-hidden="true">🌐</span> {PORTAL_LABELS.activities.website}
                    </a>
                  )}
                  {activity.phone && (
                    <a
                      href={`tel:${activity.phone.replace(/\s/g, '')}`}
                      className="text-sm text-aoz-primary hover:underline flex items-center gap-1"
                    >
                      <span aria-hidden="true">📞</span> {activity.phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[36px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-aoz-primary text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}
