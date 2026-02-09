import { ReactNode } from 'react'
import { IconClose } from './Icons'

/**
 * Props for Modal component
 */
interface ModalProps {
  /** Modal title displayed in header */
  title: string
  /** Callback function called when modal is closed */
  onClose: () => void
  /** Modal content */
  children: ReactNode
  /** Max width CSS class, e.g. "max-w-4xl" or "max-w-2xl" (default: "max-w-4xl") */
  maxWidth?: string
  /** Optional footer content (buttons, actions, etc.) */
  footer?: ReactNode
}

/**
 * Modal dialog component with backdrop, header, body, and optional footer
 * 
 * Provides a centered modal overlay with:
 * - Backdrop blur effect
 * - Close button in header
 * - Scrollable content area
 * - Optional footer section
 * 
 * @example
 * ```tsx
 * <Modal
 *   title="Create Project"
 *   onClose={() => setIsOpen(false)}
 *   maxWidth="max-w-2xl"
 *   footer={
 *     <div className="flex gap-2">
 *       <Button onClick={handleSave}>Save</Button>
 *       <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
 *     </div>
 *   }
 * >
 *   <ProjectForm onSubmit={handleSubmit} />
 * </Modal>
 * ```
 */
export default function Modal({ title, onClose, children, maxWidth = 'max-w-4xl', footer }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-slate-800 rounded-2xl border border-slate-700 w-full ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="font-display text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end px-6 py-4 border-t border-slate-700 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

