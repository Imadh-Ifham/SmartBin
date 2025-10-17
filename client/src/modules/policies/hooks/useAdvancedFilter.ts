import { useMemo, useCallback } from 'react'

interface FilterConfig {
  query: string
  status: string
  complianceStatus?: string
  ministry?: string
  sortField: 'title' | 'status' | 'date' | 'compliance'
  sortOrder: 'asc' | 'desc'
}

/**
 * Advanced filtering hook with memoization
 * Handles search, filter, and sort logic efficiently
 */
export function useAdvancedFilter<T extends Record<string, any>>(
  data: T[],
  config: FilterConfig,
  getSearchableFields?: (item: T) => string[]
) {
  // Memoized filtered and sorted data
  const filtered = useMemo(() => {
    let result = [...data]

    // 1. Text search
    if (config.query) {
      const q = config.query.toLowerCase()
      result = result.filter(item => {
        const fields = getSearchableFields?.(item) ?? [
          item.title,
          item.description,
          item._id,
          item.ministry
        ]
        return fields.some(f => String(f || '').toLowerCase().includes(q))
      })
    }

    // 2. Status filter
    if (config.status && config.status !== 'all') {
      result = result.filter(item => item.status === config.status)
    }

    // 3. Compliance filter
    if (config.complianceStatus && config.complianceStatus !== 'all') {
      result = result.filter(item => item.complianceStatus === config.complianceStatus)
    }

    // 4. Ministry filter
    if (config.ministry && config.ministry !== 'all') {
      result = result.filter(item => item.ministry === config.ministry)
    }

    // 5. Sorting
    result.sort((a, b) => {
      let aVal: any, bVal: any

      switch (config.sortField) {
        case 'title':
          aVal = (a.title || '').toLowerCase()
          bVal = (b.title || '').toLowerCase()
          break
        case 'status':
          aVal = a.status || ''
          bVal = b.status || ''
          break
        case 'compliance':
          aVal = a.complianceStatus || ''
          bVal = b.complianceStatus || ''
          break
        case 'date':
          aVal = new Date(a.createdAt || 0).getTime()
          bVal = new Date(b.createdAt || 0).getTime()
          break
        default:
          aVal = a.title
          bVal = b.title
      }

      if (aVal < bVal) return config.sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return config.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [data, config, getSearchableFields])

  // Get unique values for filter dropdowns
  const getUniqueValues = useCallback((field: keyof T): string[] => {
    return [...new Set(data.map(item => String(item[field])).filter(Boolean))]
      .sort()
  }, [data])

  // Get filter statistics
  const stats = useMemo(() => ({
    total: data.length,
    filtered: filtered.length,
    statuses: data.reduce((acc, item) => {
      const status = item.status || 'Draft'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    complianceStats: data.reduce((acc, item) => {
      const compliance = item.complianceStatus || 'Pending'
      acc[compliance] = (acc[compliance] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }), [data, filtered])

  return {
    data: filtered,
    stats,
    getUniqueValues
  }
}
