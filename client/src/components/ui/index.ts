/**
 * UI Components - centralized exports
 * 
 * All reusable UI components are exported here.
 * These components provide consistent styling and behavior across the application.
 * 
 * @example
 * ```tsx
 * import { Button, Input, Modal, FormField } from '@/components/ui'
 * 
 * function MyComponent() {
 *   return (
 *     <Modal title="Example" onClose={() => {}}>
 *       <FormField label="Name">
 *         <Input placeholder="Enter name" />
 *       </FormField>
 *       <Button variant="primary">Submit</Button>
 *     </Modal>
 *   )
 * }
 * ```
 */

// Form components
export { default as Button } from './Button'
export type { ButtonProps } from './Button'
export { default as Input } from './Input'
export type { InputProps } from './Input'
export { default as Select } from './Select'
export type { SelectProps, SelectOption } from './Select'
export { default as FormField } from './FormField'
export type { FormFieldProps } from './FormField'

// Layout components
export { default as Modal } from './Modal'
export { default as BackButton } from './BackButton'
export { default as EmptyState } from './EmptyState'
export type { EmptyStateProps } from './EmptyState'

// Feedback components
export { default as Spinner, PageSpinner } from './Spinner'
export { default as LoadingState, PageLoadingState } from './LoadingState'
export type { LoadingStateProps } from './LoadingState'
export { default as ErrorAlert } from './ErrorAlert'
export { default as Toast } from './Toast'
export type { ToastProps } from './Toast'
export { ToastProvider, useToast } from './ToastContainer'
export type { ToastData } from './ToastContainer'

// Icons
export {
  IconPlus,
  IconTrash,
  IconCheck,
  IconClose,
  IconBack,
  IconSync,
  IconRefresh,
  IconEye,
  IconCopy,
  IconClock,
  IconDocument,
  IconDuplicate,
  IconEdit,
  IconDownload,
  IconSettings,
  IconLink,
  IconChevronRight,
  IconExternalLink,
  IconCalculator,
  IconBox,
  IconBolt,
} from './Icons'

