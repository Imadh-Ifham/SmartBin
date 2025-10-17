"use client"

import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  MessageSquare,
  AlertTriangle,
  Calendar,
  Tag,
  BarChart3,
  FileText,
  Clock,
  Trash2,
} from "lucide-react"
import FeedbackModal from "../components/FeedbackModal"
import { policyStore } from "../policyStore"
import { PolicyAPI } from "../api/policyApi"
import toast from "react-hot-toast"

export default function PolicyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"description" | "performance" | "compliance" | "versions" | "feedback">(
    "description",
  )
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [policy, setPolicy] = useState<any | null>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [feedback, setFeedback] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    const fromStore = policyStore.getById(id as string)
    if (fromStore) setPolicy(fromStore)
    
    // Fetch policy and versions/feedback from API
    ;(async () => {
      try {
        const res = await PolicyAPI.getById(id as string)
        if (mounted) setPolicy(res as any)
        
        // Fetch versions and feedback
        try {
          const versionsRes = await PolicyAPI.getVersions(id as string)
          if (mounted) setVersions(versionsRes as any)
        } catch (err) {
          // versions not available
        }
        
        try {
          const auditRes = await PolicyAPI.getAudit(id as string)
          if (mounted && auditRes) setFeedback(auditRes as any)
        } catch (err) {
          // audit/feedback not available
        }
      } catch (err) {
        // keep store value
      }
    })()
    
    const unsub = policyStore.subscribe((items) => {
      const found = items.find((it) => it.id === id)
      if (mounted && found) setPolicy(found)
    })
    
    return () => {
      mounted = false
      unsub()
    }
  }, [id])

  if (!policy) {
    return (
      <div style={{ padding: 'var(--spacing-8)', backgroundColor: 'var(--color-dark-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'var(--color-dark-surface)', padding: 'var(--spacing-12)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-gray-400)', marginBottom: 'var(--spacing-4)' }}>Policy not found</p>
          <Link to="/admin/policies" style={{ color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer' }}>
            Back to Policies
          </Link>
        </div>
      </div>
    )
  }

  const handleFeedbackSubmit = async (feedbackData: { name: string; role: string; comment: string }) => {
    try {
      // try API request
      if (!policy) throw new Error('Policy not loaded')
      await PolicyAPI.requestFeedback(policy.id, { message: feedbackData.comment })
      setFeedback((s) => [
        { id: `fb-${Date.now()}`, name: feedbackData.name, role: feedbackData.role, comment: feedbackData.comment, date: new Date().toISOString() },
        ...s,
      ])
      toast.success('Feedback requested')
    } catch (err) {
      console.error('Failed to request feedback', err)
      toast.error('Failed to request feedback')
    }
  }

  const handleApprove = async () => {
    if (!policy) return
    const original = { ...policy }
    try {
      policyStore.update(policy.id, { status: 'Active', complianceStatus: 'Compliant' } as any)
      const res = await PolicyAPI.approve(policy.id)
      if (res && (res as any).id) policyStore.replace(policy.id, res as any)
      toast.success('Policy approved')
    } catch (err) {
      policyStore.replace(policy.id, original)
      console.error('Approve failed', err)
      toast.error('Failed to approve policy')
    }
  }

  const handleDelete = async () => {
    if (!policy) return
    if (!confirm('Delete this policy?')) return
    const backup = { ...policy }
    try {
      policyStore.remove(policy.id)
      await PolicyAPI.remove(policy.id)
      toast.success('Policy deleted')
      navigate('/admin/policies')
    } catch (err) {
      policyStore.add(backup)
      console.error('Delete failed', err)
      toast.error('Failed to delete policy')
    }
  }

  const getComplianceBadge = (compliance: string) => {
    const styles: Record<string, string> = {
      Compliant: "bg-green-100 text-green-800 border-green-200",
      "Non-Compliant": "bg-red-100 text-red-800 border-red-200",
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[compliance]}`}>
        {compliance}
      </span>
    )
  }

  const getPerformanceColor = (performance: number) => {
    if (performance >= 85) return "bg-green-500"
    if (performance >= 70) return "bg-yellow-500"
    return "bg-red-500"
  }

  const tabs = [
    { id: "description", label: "Description", icon: FileText },
    { id: "performance", label: "Performance", icon: BarChart3 },
    { id: "compliance", label: "Compliance", icon: CheckCircle },
    { id: "versions", label: "Version History", icon: Clock },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
  ]

  return (
    <div style={{ padding: 'var(--spacing-8)', backgroundColor: 'var(--color-dark-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* success toast UI removed: toasts are handled via react-hot-toast */}

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        policyTitle={policy.title}
        onSubmit={handleFeedbackSubmit}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-4)' }}>
        <button
          onClick={() => navigate("/admin/policies")}
          style={{ padding: 'var(--spacing-2)', backgroundColor: 'transparent', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'background-color 0.2s' }}
        >
          <ArrowLeft style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-gray-400)' }} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '600', color: 'var(--color-gray-50)' }}>{policy.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-2)', fontSize: '0.875rem', color: 'var(--color-gray-400)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Tag style={{ width: '1rem', height: '1rem' }} />
              <span>{policy.category}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar style={{ width: '1rem', height: '1rem' }} />
              <span>Created {new Date(policy.createdAt || policy.lastUpdated).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontWeight: '500' }}>Version:</span>
              <span>{policy.version || "1.0"}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <Link
            to={`/admin/policies/edit/${policy.id}`}
            style={{ backgroundColor: 'var(--color-primary)', color: 'white', paddingLeft: 'var(--spacing-4)', paddingRight: 'var(--spacing-4)', paddingTop: 'var(--spacing-2)', paddingBottom: 'var(--spacing-2)', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', transition: 'opacity 0.2s', textDecoration: 'none', cursor: 'pointer' }}
          >
            <Edit style={{ width: '1rem', height: '1rem' }} />
            Edit Policy
          </Link>
          <button
            onClick={handleApprove}
            style={{ backgroundColor: '#10b981', color: 'white', paddingLeft: 'var(--spacing-4)', paddingRight: 'var(--spacing-4)', paddingTop: 'var(--spacing-2)', paddingBottom: 'var(--spacing-2)', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', transition: 'opacity 0.2s', border: 'none', cursor: 'pointer' }}
          >
            <CheckCircle style={{ width: '1rem', height: '1rem' }} />

            Approve
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Request Feedback
          </button>
        </div>
      </div>

      {/* Compliance Alert */}
      {policy.compliance === "Non-Compliant" && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Compliance Issue Detected</h3>
            <p className="text-sm text-red-700 mt-1">
              This policy conflicts with regional requirements. Please review and update to ensure compliance.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-8">
          {/* Description Tab */}
          {activeTab === "description" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Policy Description</h3>
                <p className="text-gray-700 leading-relaxed">{policy.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Compliance Requirements</h3>
                <p className="text-gray-700 leading-relaxed">{policy.complianceRequirements || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div>
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <p className="text-gray-800 font-medium mt-1">{policy.status || "Draft"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Last Updated</span>
                  <p className="text-gray-800 font-medium mt-1">
                    {new Date(policy.lastUpdated).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Score</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Current Performance</span>
                      <span className="font-semibold">{policy.performance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full ${getPerformanceColor(policy.performance)} transition-all duration-500`}
                        style={{ width: `${policy.performance}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gray-800">{policy.performance}%</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-700 font-medium">Target</div>
                  <div className="text-2xl font-bold text-green-800 mt-1">85%</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-700 font-medium">Average</div>
                  <div className="text-2xl font-bold text-blue-800 mt-1">78%</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-700 font-medium">Trend</div>
                  <div className="text-2xl font-bold text-purple-800 mt-1">+5%</div>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">Performance Analysis</h4>
                <p className="text-gray-700 leading-relaxed">
                  {policy.performance >= 85
                    ? "This policy is performing excellently and exceeds the target threshold. Continue monitoring to maintain high standards."
                    : policy.performance >= 70
                      ? "This policy is performing adequately but has room for improvement. Consider reviewing implementation strategies to reach the target of 85%."
                      : "This policy is underperforming and requires immediate attention. Review compliance issues and implementation challenges to improve effectiveness."}
                </p>
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === "compliance" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Compliance Status</h3>
                {getComplianceBadge(policy.compliance)}
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Requirements</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{policy.complianceRequirements}</p>
                </div>

                {policy.compliance === "Compliant" && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-800">Fully Compliant</h4>
                        <p className="text-sm text-green-700 mt-1">
                          This policy meets all regulatory requirements and standards. No action required.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {policy.compliance === "Non-Compliant" && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-800">Non-Compliant</h4>
                        <p className="text-sm text-red-700 mt-1">
                          This policy does not meet current regulatory standards. Immediate review and updates are
                          required to ensure compliance.
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                          <li>Review regional waste management regulations</li>
                          <li>Update sorting guidelines to match current standards</li>
                          <li>Implement additional training requirements</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {policy.compliance === "Pending" && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-800">Pending Review</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          This policy is awaiting compliance review. Approval is required before implementation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Version History Tab */}
          {activeTab === "versions" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Version History</h3>
              <div className="space-y-3">
                {versions.map((version: any, index: number) => (
                  <div
                    key={version.version}
                    className={`p-4 rounded-lg border ${index === 0 ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{version.version}</span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">Current</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{version.description}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(version.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === "feedback" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Stakeholder Feedback</h3>
                <button
                  onClick={() => setIsFeedbackModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  Add Feedback
                </button>
              </div>
              {feedback.length > 0 ? (
                <div className="space-y-4">
                  {feedback.map((item: any) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-800">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.role}</div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mt-2">{item.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No feedback received yet</p>
                  <button
                    onClick={() => setIsFeedbackModalOpen(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    Request Feedback
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}