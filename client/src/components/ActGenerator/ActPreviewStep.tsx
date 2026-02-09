import { ActLine } from './ActDocumentTemplate'
import ActDocumentTemplate from './ActDocumentTemplate'

interface ActPreviewStepProps {
  actRef: React.RefObject<HTMLDivElement>
  actNumber: string
  actDate: string
  executorName: string
  executorDetails: string
  customerName: string
  directorName: string
  actLines: ActLine[]
  grandTotal: number
  images: Record<string, string>
}

export default function ActPreviewStep({
  actRef,
  actNumber,
  actDate,
  executorName,
  executorDetails,
  customerName,
  directorName,
  actLines,
  grandTotal,
  images,
}: ActPreviewStepProps) {
  return (
    <div>
      <div className="bg-white rounded-xl shadow-lg overflow-auto mx-auto" style={{ maxWidth: '850px' }}>
        <ActDocumentTemplate
          ref={actRef}
          actNumber={actNumber}
          actDate={actDate}
          executorName={executorName}
          executorDetails={executorDetails}
          customerName={customerName}
          directorName={directorName}
          actLines={actLines}
          grandTotal={grandTotal}
          images={images}
        />
      </div>
    </div>
  )
}


