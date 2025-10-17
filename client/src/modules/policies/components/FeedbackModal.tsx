type Props = {
  isOpen: boolean
  onClose: () => void
  policyTitle?: string
  onSubmit: (data: { name: string; role: string; comment: string }) => void
}

export default function FeedbackModal({ isOpen, onClose, policyTitle, onSubmit }: Props) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-semibold">Request feedback{policyTitle ? `: ${policyTitle}` : ''}</h3>
        <p className="text-sm text-gray-600 mt-2">This is a placeholder feedback modal for the demo.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Close</button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => {
              onSubmit({ name: 'Demo', role: 'Reviewer', comment: 'Looks fine' })
              onClose()
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
