import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePolicy, useUpdatePolicy, useApprovePolicy, useRequestFeedback, usePolicyVersions } from '../hooks/usePolicies'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, MessageSquare, Edit2, Save, X, Calendar, Tag, AlertCircle, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react'

export default function PolicyReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = usePolicy(id)
  const updateMutation = useUpdatePolicy()
  const approveMutation = useApprovePolicy()
  const feedbackMutation = useRequestFeedback()
  const versionsQuery = usePolicyVersions(id)
  const [editing, setEditing] = useState(false)
  const [description, setDescription] = useState('')
  const [showIssueDialog, setShowIssueDialog] = useState(false)
  const [issueText, setIssueText] = useState('')

  useEffect(() => {
    if (data) {
      const policy = data as any
      setDescription(policy.description || '')
    }
  }, [data])

  const handleApprove = () => {
    if (!id) return
    (approveMutation as any).mutateAsync(id).then((response: any) => {
      toast.success('✅ Policy approved successfully')
      
      // Show notification confirmation
      const policy = response?.policy || response
      const stakeholders = policy?.stakeholders || []
      if (stakeholders.length > 0) {
        setTimeout(() => {
          toast.success(`📧 Notification sent to ${stakeholders.length} stakeholder(s)`, {
            duration: 4000,
            icon: '📬'
          })
        }, 800)
      }
      
      setTimeout(() => navigate('/admin/policies'), 2000)
    }).catch((e: any) => {
      toast.error(e?.message || 'Failed to approve policy')
    })
  }

  const handleRevalidateCompliance = async () => {
    if (!id) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/policies/${id}/revalidateCompliance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error('Failed to revalidate compliance')
      const result = await response.json()
      
      if (result.statusChanged) {
        toast.success(`Compliance status updated: ${result.policy.complianceStatus}`, {
          duration: 5000,
          icon: '🔄'
        })
      } else {
        toast.success(`Compliance confirmed: ${result.policy.complianceStatus}`, {
          icon: '✓'
        })
      }
      
      if (result.complianceResult.issues.length > 0) {
        setTimeout(() => {
          toast.error(`Found ${result.complianceResult.issues.length} compliance issue(s)`, {
            duration: 5000
          })
        }, 500)
      }
      
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Failed to revalidate compliance')
    }
  }

  const handleRequestFeedback = () => {
    if (!id) return
    (feedbackMutation as any).mutateAsync({ 
      id, 
      payload: { message: 'Please review and provide feedback' } 
    }).then(() => {
      toast.success('Feedback requested from stakeholders')
    }).catch((e: any) => {
      toast.error(e?.message || 'Failed to request feedback')
    })
  }

  const handleSaveDescription = () => {
    if (!id) return
    (updateMutation as any).mutateAsync({ 
      id, 
      payload: { description } 
    }).then(() => {
      toast.success('Description updated successfully')
      setEditing(false)
    }).catch((e: any) => {
      toast.error(e?.message || 'Failed to update description')
    })
  }

  const handleFlagIssue = async () => {
    if (!id || !issueText.trim()) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/policies/${id}/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ issue: issueText })
      })
      if (!response.ok) throw new Error('Failed to flag issue')
      toast.success('Issue flagged successfully')
      setShowIssueDialog(false)
      setIssueText('')
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Failed to flag issue')
    }
  }

  if (isLoading) return (
    <div style={{ padding: 'var(--spacing-8)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--color-dark-bg)' }}>
      <div style={{ animation: 'spin 1s linear infinite', borderRadius: '9999px', height: '3rem', width: '3rem', borderBottom: `2px solid var(--color-primary)` }}></div>
    </div>
  )
  
  const policy = data as any

  return (
    <div style={{ padding: 'var(--spacing-8)', backgroundColor: 'var(--color-dark-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/admin/policies')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--color-primary)', fontWeight: '500', marginBottom: 'var(--spacing-4)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Policies
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--color-gray-50)' }}>{policy?.title}</h1>
            <p style={{ color: 'var(--color-gray-400)', marginTop: 'var(--spacing-2)' }}>Review and manage policy details</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            <button 
              onClick={handleApprove} 
              disabled={approveMutation.isPending}
              className="btn btn-success"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
            >
              <CheckCircle className="w-4 h-4" />
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </button>
            <button 
              onClick={() => setEditing((s) => !s)} 
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
            >
              <Edit2 className="w-4 h-4" />
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button 
              onClick={handleRequestFeedback}
              disabled={feedbackMutation.isPending}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
            >
              <MessageSquare className="w-4 h-4" />
              {feedbackMutation.isPending ? 'Sending...' : 'Request Feedback'}
            </button>
            <button 
              onClick={() => setShowIssueDialog(true)}
              className="btn btn-danger"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
            >
              <AlertTriangle className="w-4 h-4" />
              Flag Issue
            </button>
            <button 
              onClick={handleRevalidateCompliance}
              className="btn btn-warning"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
            >
              <BarChart3 className="w-4 h-4" />
              Revalidate Compliance
            </button>
          </div>
        </div>
      </div>

      {/* Issue Dialog */}
      {showIssueDialog && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setShowIssueDialog(false)}>
          <div className="card" style={{ maxWidth: '32rem', width: '90%', padding: 'var(--spacing-6)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-4)' }}>Flag Issue</h3>
            <textarea 
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              placeholder="Describe the issue with this policy..."
              className="form-control"
              style={{ minHeight: '6rem', marginBottom: 'var(--spacing-4)' }}
            />
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowIssueDialog(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleFlagIssue} disabled={!issueText.trim()}>Flag Issue</button>
            </div>
          </div>
        </div>
      )}

      {/* Performance & Compliance Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
        {policy?.performanceReport && (
          <div className="card" style={{ padding: 'var(--spacing-4)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <TrendingUp style={{ width: '2rem', height: '2rem', color: 'var(--color-success)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', fontWeight: '500' }}>PERFORMANCE</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-gray-50)' }}>{policy.performanceReport.performanceScore || 0}%</p>
              </div>
            </div>
          </div>
        )}
        
        {policy?.violations && policy.violations.length > 0 && (
          <div className="card" style={{ padding: 'var(--spacing-4)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <AlertCircle style={{ width: '2rem', height: '2rem', color: 'var(--color-error)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', fontWeight: '500' }}>VIOLATIONS</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-error)' }}>{policy.violations.length}</p>
              </div>
            </div>
          </div>
        )}
        
        {policy?.issues && policy.issues.length > 0 && (
          <div className="card" style={{ padding: 'var(--spacing-4)', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <AlertTriangle style={{ width: '2rem', height: '2rem', color: 'var(--color-warning)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', fontWeight: '500' }}>ISSUES</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>{policy.issues.length}</p>
              </div>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 'var(--spacing-4)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <BarChart3 style={{ width: '2rem', height: '2rem', color: 'var(--color-info)' }} />
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', fontWeight: '500' }}>VERSION</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-gray-50)' }}>v{policy?.version || 1}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="card" style={{ padding: 'var(--spacing-8)' }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-2)' }}>
                Edit Description
              </label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="form-control"
                style={{ height: '10rem', resize: 'none' }}
                placeholder="Edit policy description..."
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', paddingTop: 'var(--spacing-4)', borderTop: `var(--border-width-base) solid var(--color-dark-border)` }}>
              <button 
                onClick={handleSaveDescription}
                disabled={updateMutation.isPending}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={() => setEditing(false)} 
                className="btn btn-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-4)' }}>Policy Description</h2>
              <p style={{ color: 'var(--color-gray-300)', whiteSpace: 'pre-wrap', lineHeight: '1.625' }}>{policy?.description || 'No description'}</p>
            </div>

            {/* Policy Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)', paddingTop: 'var(--spacing-6)', borderTop: `var(--border-width-base) solid var(--color-dark-border)` }}>
              <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <div style={{ flexShrink: 0 }}>
                  <Tag style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)', marginTop: '0.25rem' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-gray-400)' }}>Status</p>
                  <div className="badge badge-primary" style={{ marginTop: 'var(--spacing-1)' }}>
                    {policy?.status || 'Draft'}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <div style={{ flexShrink: 0 }}>
                  <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-warning)', marginTop: '0.25rem' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-gray-400)' }}>Compliance Status</p>
                  <div className={`badge ${
                    policy?.complianceStatus === 'Compliant' ? 'badge-success' : 
                    policy?.complianceStatus === 'NonCompliant' ? 'badge-danger' : 
                    'badge-warning'
                  }`} style={{ marginTop: 'var(--spacing-1)' }}>
                    {policy?.complianceStatus === 'NonCompliant' ? '⚠️ Non-Compliant' : 
                     policy?.complianceStatus === 'Compliant' ? '✓ Compliant' : 
                     '⏳ Pending'}
                  </div>
                  {policy?.complianceStatus === 'NonCompliant' && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-error)', marginTop: 'var(--spacing-1)' }}>
                      Click "Revalidate Compliance" to check again
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <div style={{ flexShrink: 0 }}>
                  <Tag style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-secondary)', marginTop: '0.25rem' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-gray-400)' }}>Category</p>
                  <p style={{ color: 'var(--color-gray-50)', marginTop: 'var(--spacing-1)', fontWeight: '500' }}>{policy?.category || 'N/A'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <div style={{ flexShrink: 0 }}>
                  <Calendar style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-success)', marginTop: '0.25rem' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-gray-400)' }}>Effective Date</p>
                  <p style={{ color: 'var(--color-gray-50)', marginTop: 'var(--spacing-1)', fontWeight: '500' }}>
                    {policy?.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Issues Section */}
      {policy?.issues && policy.issues.length > 0 && (
        <div className="card" style={{ padding: 'var(--spacing-6)', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid var(--color-error)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-error)', marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <AlertTriangle className="w-5 h-5" />
            Flagged Issues ({policy.issues.length})
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            {policy.issues.map((issue: string, idx: number) => (
              <li key={idx} style={{ padding: 'var(--spacing-3)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--border-radius-md)', color: 'var(--color-gray-200)' }}>
                • {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Violations Section */}
      {policy?.violations && policy.violations.length > 0 && (
        <div className="card" style={{ padding: 'var(--spacing-6)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-error)', marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <AlertCircle className="w-5 h-5" />
            Compliance Violations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            {policy.violations.map((violation: any, idx: number) => (
              <div key={idx} style={{ padding: 'var(--spacing-3)', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--border-radius-md)', borderLeft: '3px solid var(--color-error)' }}>
                <p style={{ fontWeight: '600', color: 'var(--color-gray-50)' }}>{violation.type || 'Violation'}</p>
                {violation.description && <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-400)', marginTop: 'var(--spacing-1)' }}>{violation.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {policy?.auditTrail && policy.auditTrail.length > 0 && (
        <div className="card" style={{ padding: 'var(--spacing-8)' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-6)' }}>Audit Trail</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {(policy.auditTrail as any[]).map((entry: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', gap: 'var(--spacing-4)', paddingBottom: 'var(--spacing-4)', borderBottom: `var(--border-width-base) solid var(--color-dark-border)` }}>
                <div style={{ flexShrink: 0, width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: 'var(--color-primary)', marginTop: '0.5rem' }}></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', color: 'var(--color-gray-50)' }}>{entry.action}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-1)' }}>
                    {new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version History */}
      {versionsQuery.data && Array.isArray(versionsQuery.data) && versionsQuery.data.length > 0 && (
        <div className="card" style={{ padding: 'var(--spacing-8)' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-6)' }}>Version History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {(versionsQuery.data as any[]).map((version: any, idx: number) => (
              <div key={version._id || idx} style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-4)', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--border-radius-md)', border: `1px solid var(--color-dark-border)` }}>
                <div style={{ flexShrink: 0, width: '2rem', height: '2rem', borderRadius: '9999px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>
                  v{version.version || idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-2)' }}>
                    <p style={{ fontWeight: '600', color: 'var(--color-gray-50)' }}>{version.title}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                      {new Date(version.createdAt || version.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-400)', marginBottom: 'var(--spacing-2)' }}>
                    Status: {version.status || 'Draft'} • Compliance: {version.complianceStatus || 'Pending'}
                  </p>
                  {version.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-300)' }}>
                      {version.description.length > 100 ? `${version.description.substring(0, 100)}...` : version.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Section */}
      {policy?.feedback && policy.feedback.length > 0 && (
        <div className="card" style={{ padding: 'var(--spacing-8)' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-6)' }}>Stakeholder Feedback</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {(policy.feedback as any[]).map((fb: any, idx: number) => (
              <div key={idx} className="card" style={{ padding: 'var(--spacing-4)', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'var(--color-dark-border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                  <p style={{ fontWeight: '600', color: 'var(--color-gray-50)' }}>{fb.stakeholderType}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                    {new Date(fb.date || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ color: 'var(--color-gray-300)' }}>{fb.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Feedback Message */}
      {(!policy?.feedback || policy.feedback.length === 0) && (
        <div className="card" style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
          <MessageSquare style={{ width: '3rem', height: '3rem', color: 'var(--color-gray-600)', margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'var(--color-gray-400)' }}>No feedback received yet</p>
        </div>
      )}
    </div>
  )
}
