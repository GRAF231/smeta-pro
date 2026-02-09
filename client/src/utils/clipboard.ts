/**
 * Copy text to clipboard with fallback for non-secure contexts
 * 
 * Uses modern Clipboard API when available (secure contexts),
 * falls back to execCommand for older browsers or non-secure contexts.
 * 
 * @param text - Text string to copy to clipboard
 * @returns Promise that resolves to true on success, false on failure
 * 
 * @example
 * ```tsx
 * const handleCopy = async () => {
 *   const success = await copyToClipboard('Hello, world!')
 *   if (success) {
 *     toast.success('Copied to clipboard!')
 *   } else {
 *     toast.error('Failed to copy')
 *   }
 * }
 * ```
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}

