import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { Policy } from '../types'
import toast from 'react-hot-toast'
import { usePolicy, useCreatePolicy, useUpdatePolicy } from '../hooks/usePolicies'
import { ArrowLeft, Save, X } from 'lucide-react'

const PolicyFormPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const [policy, setPolicy] = useState<Partial<Policy> | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { data: fetched } = usePolicy(id)
  const createMutation = useCreatePolicy()
  const updateMutation = useUpdatePolicy()

  useEffect(() => {
    let mounted = true
    if (id) {
      // prefer react-query fetched value
      if (fetched && mounted) {
        // Ensure effectiveDate is a string for the input
        const data = fetched as any
        const dateStr = data.effectiveDate instanceof Date 
          ? data.effectiveDate.toISOString().split('T')[0]
          : typeof data.effectiveDate === 'string' 
          ? data.effectiveDate.split('T')[0]
          : ''
        setPolicy({ ...data, effectiveDate: dateStr } as Policy)
      }
    } else {
      setPolicy({ 
        title: '', 
        category: '', 
        description: '', 
        complianceStatus: 'Pending', 
        effectiveDate: new Date().toISOString().split('T')[0],
        status: 'Draft'
      })
    }
    return () => {
      mounted = false
    }
  }, [id, fetched])

  const navigateToList = () => {
    // choose admin list when inside admin routes
    if (location.pathname.startsWith('/admin')) {
      navigate('/admin/policies')
    } else {
      navigate('/policies')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!policy) return
    // client-side validation
    const nextErrors: Record<string, string> = {}
    if (!policy.title || !policy.title.trim()) nextErrors.title = 'Title is required'
    if (!policy.description || !policy.description.trim()) nextErrors.description = 'Description is required'
    // effectiveDate is optional but if provided should be a valid date
    if (policy.effectiveDate) {
      const d = Date.parse(policy.effectiveDate as string)
      if (Number.isNaN(d)) nextErrors.effectiveDate = 'Effective date must be a valid date (YYYY-MM-DD)'
    } else {
      nextErrors.effectiveDate = 'Effective date is required'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix validation errors')
      return
    }
    setLoading(true)
    try {
      const payload = {
        title: policy.title,
        description: policy.description,
        category: policy.category,
        ministry: policy.ministry,
        effectiveDate: new Date(policy.effectiveDate as string).toISOString(),
        status: policy.status,
        complianceStatus: policy.complianceStatus
      }
      console.log('Submitting policy payload:', payload)
      console.log('Token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing')
      
      if (id) {
        await (updateMutation as any).mutateAsync({ id, payload })
        toast.success('Policy updated successfully')
      } else {
        await (createMutation as any).mutateAsync(payload)
        toast.success('Policy created successfully')
      }
      navigateToList()
    } catch (err) {
      console.error('❌ Policy creation/update error:', err)
      const anyErr = err as any
      console.error('📋 Error details:', {
        response: anyErr?.response,
        data: anyErr?.response?.data,
        status: anyErr?.response?.status,
        statusText: anyErr?.response?.statusText,
        message: anyErr?.message,
        fullError: anyErr
      })
      
      // Show detailed error in alert for debugging
      const errorInfo = `
Status: ${anyErr?.response?.status || 'Unknown'}
Message: ${anyErr?.response?.data?.error || anyErr?.message || 'Unknown error'}
Details: ${JSON.stringify(anyErr?.response?.data?.details || {}, null, 2)}
      `.trim()
      
      console.error('🚨 FULL ERROR INFO:\n', errorInfo)
      
      if (anyErr?.response?.data?.details && typeof anyErr.response.data.details === 'object') {
        const apiErrors: Record<string, string> = {}
        Object.entries(anyErr.response.data.details).forEach(([k, v]) => {
          apiErrors[k] = Array.isArray(v) ? String(v[0]) : String(v)
        })
        setErrors(apiErrors)
        toast.error('Validation failed: ' + JSON.stringify(apiErrors), { duration: 6000 })
      } else if (anyErr?.response?.data?.error) {
        toast.error('Server error: ' + String(anyErr.response.data.error), { duration: 6000 })
      } else if (anyErr?.response?.data?.message) {
        toast.error('Server message: ' + String(anyErr.response.data.message), { duration: 6000 })
      } else if (anyErr?.message) {
        toast.error('Error: ' + anyErr.message, { duration: 6000 })
      } else {
        toast.error('Failed to save policy - Check console for details (F12)', { duration: 6000 })
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading && !policy) return (
    <div style={{ padding: 'var(--spacing-8)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--color-dark-bg)' }}>
      <div style={{ animation: 'spin 1s linear infinite', borderRadius: '9999px', height: '3rem', width: '3rem', borderBottom: `2px solid var(--color-primary)` }}></div>
    </div>
  )
  if (!policy) return (
    <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--color-gray-500)', backgroundColor: 'var(--color-dark-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Policy not found</p>
    </div>
  )

  return (
    <div style={{ padding: 'var(--spacing-8)', backgroundColor: 'var(--color-dark-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <button
          onClick={navigateToList}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--color-primary)', fontWeight: '500', marginBottom: 'var(--spacing-4)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Policies
        </button>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--color-gray-50)' }}>
          {id ? 'Edit Policy' : 'Create New Policy'}
        </h1>
        <p style={{ color: 'var(--color-gray-400)', marginTop: 'var(--spacing-2)' }}>
          {id ? 'Update policy details and settings' : 'Add a new policy to the system'}
        </p>
      </div>

      {/* Form Container */}
      <div style={{ maxWidth: '42rem', backgroundColor: 'var(--color-dark-surface)', borderRadius: 'var(--border-radius-lg)', border: `var(--border-width-base) solid var(--color-dark-border)`, padding: 'var(--spacing-8)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-2)' }}>
              Policy Title <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              className={`form-control ${errors.title ? 'border-red-500' : ''}`}
              value={policy.title ?? ''}
              onChange={(e) => {
                setPolicy({ ...policy, title: e.target.value })
                if (errors.title) setErrors((s) => ({ ...s, title: '' }))
              }}
              placeholder="Enter policy title"
              required
            />
            {errors.title && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-error)', marginTop: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                <span>⚠</span> {errors.title}
              </p>
            )}
          </div>

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-2)' }}>
                Category
              </label>
              <input
                className="form-control"
                value={policy.category ?? ''}
                onChange={(e) => setPolicy({ ...policy, category: e.target.value })}
                placeholder="e.g., Environment, Safety"
              />
            </div>

            {/* Effective Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-2)' }}>
                Effective Date <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="date"
                className={`form-control ${errors.effectiveDate ? 'border-red-500' : ''}`}
                value={policy.effectiveDate ?? ''}
                onChange={(e) => {
                  setPolicy({ ...policy, effectiveDate: e.target.value })
                  if (errors.effectiveDate) setErrors((s) => ({ ...s, effectiveDate: '' }))
                }}
              />
              {errors.effectiveDate && (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-error)', marginTop: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                  <span>⚠</span> {errors.effectiveDate}
                </p>
              )}
            </div>
          </div>

          {/* Status & Compliance Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
            {/* Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-2)' }}>
                Status
              </label>
              <select
                className="form-control"
                value={policy.status ?? 'Draft'}
                onChange={(e) => setPolicy({ ...policy, status: e.target.value as any })}
              >
                <option value="Draft">Draft</option>
                <option value="UnderReview">Under Review</option>
                <option value="Active">Active</option>
                <option value="Retired">Retired</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {/* Compliance Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-2)' }}>
                Compliance Status
              </label>
              <select
                className="form-control"
                value={policy.complianceStatus ?? 'Pending'}
                onChange={(e) => setPolicy({ ...policy, complianceStatus: e.target.value as any })}
              >
                <option value="Pending">Pending</option>
                <option value="Compliant">Compliant</option>
                <option value="NonCompliant">Non-Compliant</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-2)' }}>
              Description <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <textarea
              className={`form-control ${errors.description ? 'border-red-500' : ''}`}
              style={{ height: '8rem', resize: 'none' }}
              value={policy.description ?? ''}
              onChange={(e) => {
                setPolicy({ ...policy, description: e.target.value })
                if (errors.description) setErrors((s) => ({ ...s, description: '' }))
              }}
              placeholder="Enter detailed policy description..."
            />
            {errors.description && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-error)', marginTop: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                <span>⚠</span> {errors.description}
              </p>
            )}
          </div>

          {/* Compliance Requirements */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-2)' }}>
              Compliance Requirements
            </label>
            <textarea
              className="form-control"
              style={{ height: '7rem', resize: 'none' }}
              value={(policy as any).complianceRequirements ?? ''}
              onChange={(e) => setPolicy({ ...policy, ...(policy as any), complianceRequirements: e.target.value })}
              placeholder="Specify compliance requirements and standards..."
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', paddingTop: 'var(--spacing-6)', borderTop: `var(--border-width-base) solid var(--color-dark-border)` }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Policy'}
            </button>
            <button
              type="button"
              onClick={navigateToList}
              className="btn btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PolicyFormPage
