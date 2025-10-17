import { useMemo, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePolicies, useDeletePolicy } from '../hooks/usePolicies'
import { Search, Plus, Eye, Edit2, Trash2, Download, ChevronDown, Filter, AlertCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { TableSkeleton } from '../../../components/LoadingSkeleton'

type SortField = 'title' | 'status' | 'date'
type SortOrder = 'asc' | 'desc'

const statuses = ['all', 'Draft', 'UnderReview', 'Active', 'Retired', 'Archived']

export default function AdminPoliciesPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = usePolicies()
  const deleteMutation = useDeletePolicy()
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showFilters, setShowFilters] = useState(false)

  // Debug: Log what we're receiving
  console.log('AdminPoliciesPage Debug:', { 
    data, 
    isLoading, 
    error,
    dataType: typeof data,
    isArray: Array.isArray(data),
    hasProperties: data && typeof data === 'object' ? Object.keys(data) : 'N/A'
  })

  const handleDelete = useCallback((id: string) => {
    if (deletingId === id) {
      (deleteMutation as any).mutateAsync(id).then(() => {
        toast.success('Policy deleted successfully')
        setDeletingId(null)
      }).catch((err: any) => {
        toast.error(err.message || 'Failed to delete policy')
        setDeletingId(null)
      })
    } else {
      setDeletingId(id)
      setTimeout(() => setDeletingId(null), 3000)
    }
  }, [deletingId, deleteMutation])

  const getComplianceIcon = useCallback((compliance: string) => {
    if (compliance === 'Compliant') {
      return (
        <div title="Compliant">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </div>
      )
    }
    if (compliance === 'NonCompliant') {
      return (
        <div title="Non-compliant">
          <AlertCircle className="w-4 h-4 text-red-600" />
        </div>
      )
    }
    return (
      <div title="Pending compliance">
        <AlertCircle className="w-4 h-4 text-yellow-600" />
      </div>
    )
  }, [])

  const policies: any[] = useMemo(() => {
    let list = Array.isArray(data) ? data : (data as any)?.policies ?? []
    
    // Filter by search query
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((p: any) => 
        (p.title || '').toLowerCase().includes(q) || 
        (p._id || '').toString().includes(q)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      list = list.filter((p: any) => (p.status ?? 'Draft') === statusFilter)
    }

    // Sort
    list.sort((a: any, b: any) => {
      let aVal: any, bVal: any
      
      switch (sortField) {
        case 'title':
          aVal = (a.title || '').toLowerCase()
          bVal = (b.title || '').toLowerCase()
          break
        case 'status':
          aVal = a.status || 'Draft'
          bVal = b.status || 'Draft'
          break
        case 'date':
          aVal = new Date(a.createdAt || 0).getTime()
          bVal = new Date(b.createdAt || 0).getTime()
          break
        default:
          aVal = a.title
          bVal = b.title
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [data, query, statusFilter, sortField, sortOrder])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }, [sortField, sortOrder])

  const activeCount = policies.filter((p: any) => p.status === 'Active').length
  const reviewCount = policies.filter((p: any) => p.status === 'UnderReview').length

  // Error state
  if (error) {
    return (
      <div style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', backgroundColor: 'var(--color-dark-bg)', minHeight: '100%' }}>
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
          <AlertCircle style={{ width: '1.5rem', height: '1.5rem', color: 'var(--color-error)', flexShrink: 0, marginTop: '0.125rem' }} />
          <div>
            <h3 style={{ fontWeight: '600', color: 'var(--color-error)' }}>Failed to load policies</h3>
            <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginTop: 'var(--spacing-1)' }}>{(error as any).message}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-error"
              style={{ marginTop: 'var(--spacing-3)', fontSize: '0.875rem' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', backgroundColor: 'var(--color-dark-bg)', minHeight: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-gray-50)', margin: 0 }}>Policies</h1>
          <p style={{ color: 'var(--color-gray-400)', marginTop: 'var(--spacing-2)' }}>
            {policies.length} policies total • {activeCount} active • {reviewCount} under review
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          <button 
            onClick={() => { /* TODO: export */ }} 
            className="btn btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
            title="Export policies to CSV"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={async () => {
              try {
                const token = localStorage.getItem('token')
                if (!token) {
                  toast.error('Please login first')
                  return
                }
                const response = await fetch('http://localhost:5000/api/policies', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    title: 'Sample Policy - ' + new Date().toLocaleTimeString(),
                    description: 'This is a sample policy for testing. Click the Edit button to modify it.',
                    category: 'Demo',
                    ministry: 'Test Department',
                    effectiveDate: new Date().toISOString(),
                    status: 'Draft',
                    complianceStatus: 'Pending'
                  })
                })
                
                if (!response.ok) {
                  const error = await response.json()
                  console.error('Policy creation error:', error)
                  toast.error(error.error || 'Failed to create policy: ' + response.statusText)
                  if (error.details) {
                    console.error('Validation details:', error.details)
                  }
                  return
                }
                
                await response.json()
                toast.success('Demo policy created successfully!')
                setTimeout(() => window.location.reload(), 1000)
              } catch (err: any) {
                console.error('Error creating demo policy:', err)
                toast.error(err.message || 'Failed to create demo policy')
              }
            }}
            className="btn btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
            title="Create a sample policy for testing"
          >
            + Demo Policy
          </button>
          <Link 
            to="/admin/policies/new" 
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
          >
            <Plus className="w-4 h-4" />
            Add New Policy
          </Link>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        {/* Search */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-4)', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--border-radius-md)', border: `1px solid var(--color-dark-border)` }}>
            <Search style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-gray-500)' }} />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search policies by name or ID..." 
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                outline: 'none',
                color: 'var(--color-gray-50)',
                fontFamily: 'var(--font-family-base)',
                fontSize: 'var(--font-size-base)',
                border: 'none'
              }}
              aria-label="Search policies"
            />
          </div>
        </div>

        {/* Filter Button and Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
            aria-expanded={showFilters}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown style={{ width: '1rem', height: '1rem', transition: 'transform var(--transition-fast)', transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>

          {/* Status Filter */}
          {showFilters && (
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap', width: '100%' }}>
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? 'badge badge-primary' : 'btn btn-ghost btn-sm'}
                  aria-pressed={statusFilter === status}
                  style={{ 
                    padding: 'var(--spacing-1) var(--spacing-3)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500'
                  }}
                >
                  {status === 'all' ? 'All' : status === 'UnderReview' ? 'Under Review' : status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <TableSkeleton />}

      {/* Table */}
      {!isLoading && (
        <div className="card" style={{ overflow: 'hidden', width: '100%' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="table table-striped" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('title')}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleSort('title')
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                      Policy Name
                      <span style={{ fontSize: 'var(--font-size-xs)' }}>{sortField === 'title' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </th>
                  <th>ID</th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('status')}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleSort('status')
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                      Status
                      <span style={{ fontSize: 'var(--font-size-xs)' }}>{sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
                    </div>
                  </th>
                  <th>Compliance</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 'var(--spacing-12) var(--spacing-6)', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-3)' }}>
                        <AlertCircle style={{ width: '3rem', height: '3rem', color: 'var(--color-gray-600)' }} />
                        <div>
                          <p style={{ color: 'var(--color-gray-50)', fontWeight: '600' }}>No policies yet</p>
                          <p style={{ color: 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-1)' }}>Create your first policy to get started. Click "+ Demo Policy" above to add a test policy.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {policies.map((p: any) => (
                  <tr key={p._id}>
                    <td>
                      <p style={{ fontWeight: '500', color: 'var(--color-gray-50)' }}>{p.title}</p>
                      {p.category && <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-1)' }}>{p.category}</p>}
                    </td>
                    <td>
                      <code style={{ fontSize: 'var(--font-size-xs)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 'var(--spacing-1) var(--spacing-2)', borderRadius: 'var(--border-radius-base)', color: 'var(--color-gray-400)', fontFamily: 'var(--font-family-mono)' }}>{p._id.slice(0, 8)}...</code>
                    </td>
                    <td>
                      <span className={`badge badge-${p.status ? (p.status === 'Draft' ? 'primary' : p.status === 'Active' ? 'success' : p.status === 'UnderReview' ? 'info' : 'danger') : 'warning'}`}>
                        {p.status ?? 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        {getComplianceIcon(p.complianceStatus ?? 'Pending')}
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '500' }}>{p.complianceStatus ?? 'Pending'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
                        <button 
                          onClick={() => navigate(`/admin/policies/${p._id}`)}
                          className="btn btn-primary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)' }}
                          title="Review policy"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
                        <Link 
                          to={`/admin/policies/${p._id}/edit`}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)' }}
                          title="Edit policy"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(p._id)} 
                          className={`btn btn-sm ${deletingId === p._id ? 'btn-danger' : 'btn-ghost'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)' }}
                          title={deletingId === p._id ? 'Click again to confirm' : 'Delete policy'}
                        >
                          <Trash2 className="w-4 h-4" />
                          {deletingId === p._id ? 'Confirm?' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      {!isLoading && policies.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-400)', padding: 'var(--spacing-4)' }}>
          <p>Showing {policies.length} of {Array.isArray(data) ? data.length : (data as any)?.policies?.length ?? 0} policies</p>
        </div>
      )}
    </div>
  )
}
