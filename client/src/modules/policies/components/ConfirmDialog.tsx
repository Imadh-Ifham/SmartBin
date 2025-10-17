type Props = {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ title = 'Confirm', description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded border">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded">{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
