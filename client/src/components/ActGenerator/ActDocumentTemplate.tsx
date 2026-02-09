import React from 'react'
import { formatDateRu, formatMoney } from '../../utils/format'
import { amountToWordsRu } from '../../utils/numberToWords'

export interface ActLine {
  number: number
  name: string
  quantity: number
  unit: string
  price: number
  total: number
}

interface ActDocumentTemplateProps {
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

/**
 * The printable HTML act document. Used for html2canvas PDF generation.
 * Reused in both ActGenerator (new acts) and ActsPage (saved act preview).
 */
const ActDocumentTemplate = React.forwardRef<HTMLDivElement, ActDocumentTemplateProps>(
  ({ actNumber, actDate, executorName, executorDetails, customerName, directorName, actLines, grandTotal, images }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: '794px',
          padding: '50px 55px',
          fontFamily: "'Times New Roman', 'DejaVu Serif', Georgia, serif",
          color: '#000',
          backgroundColor: '#fff',
          fontSize: '14px',
          lineHeight: '1.5',
          boxSizing: 'border-box',
        }}
      >
        {/* Header: logo + title */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
          <div style={{ width: '100px', flexShrink: 0 }}>
            {images.logo && (
              <img src={images.logo} alt="Логотип" style={{ maxWidth: '100px', maxHeight: '80px' }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0', padding: 0 }}>
              Акт № {actNumber} от {formatDateRu(actDate)}
            </h1>
            <div style={{ borderBottom: '3px solid #000', width: '100%' }}></div>
          </div>
        </div>

        {/* Parties */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
            <span style={{ whiteSpace: 'nowrap', minWidth: '100px' }}>Исполнитель:</span>
            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '13px' }}>
              {executorName}{executorDetails ? `, ${executorDetails}` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <span style={{ whiteSpace: 'nowrap', minWidth: '100px' }}>Заказчик:</span>
            <span style={{ fontWeight: 'bold' }}>{customerName}</span>
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle}>№</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Услуга</th>
              <th style={thStyle}>кол-во</th>
              <th style={thStyle}>Ед.</th>
              <th style={thStyle}>НДС</th>
              <th style={thStyle}>Цена</th>
              <th style={thStyle}>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {actLines.map(line => (
              <tr key={line.number}>
                <td style={{ ...tdStyle, textAlign: 'center', width: '35px' }}>{line.number}</td>
                <td style={{ ...tdStyle }}>{line.name}</td>
                <td style={{ ...tdStyle, textAlign: 'center', width: '55px' }}>{line.quantity}</td>
                <td style={{ ...tdStyle, textAlign: 'center', width: '40px' }}>{line.unit}</td>
                <td style={{ ...tdStyle, textAlign: 'center', width: '70px' }}>Без НДС</td>
                <td style={{ ...tdStyle, textAlign: 'right', width: '95px' }}>{formatMoney(line.price)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', width: '95px' }}>{formatMoney(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '20px', fontSize: '14px' }}>
          Итого к оплате: <span style={{ marginLeft: '40px' }}>{formatMoney(grandTotal)}</span>
        </div>

        {/* Text */}
        <div style={{ marginBottom: '6px', fontSize: '13px' }}>
          Всего оказано услуг на сумму {formatMoney(grandTotal)} руб.
        </div>
        <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '13px' }}>
          {amountToWordsRu(grandTotal)}
        </div>

        {/* Disclaimer */}
        <div style={{ marginBottom: '10px', fontSize: '13px' }}>
          Вышеперечисленные услуги оказаны в полном объеме и в установленный срок. Заказчик не имеет претензий по качеству, срокам
          и объемам оказанных услуг.
        </div>
        <div style={{ borderTop: '2px solid #000', marginBottom: '40px' }}></div>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span>директор</span>
            <span style={{
              display: 'inline-block',
              width: '120px',
              borderBottom: '1px solid #000',
              marginLeft: '10px',
              marginRight: '10px',
              position: 'relative',
            }}>
              {images.signature && (
                <img
                  src={images.signature}
                  alt=""
                  style={{
                    position: 'absolute',
                    bottom: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    maxWidth: '100px',
                    maxHeight: '50px',
                  }}
                />
              )}
            </span>
            <span>{directorName}</span>
          </div>

          {images.stamp && (
            <div style={{
              position: 'absolute',
              left: '50%',
              bottom: '-15px',
              transform: 'translateX(-50%)',
              zIndex: 1,
            }}>
              <img src={images.stamp} alt="" style={{ maxWidth: '180px', maxHeight: '180px' }} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span>Заказчик</span>
            <span style={{
              display: 'inline-block',
              width: '120px',
              borderBottom: '1px solid #000',
              marginLeft: '10px',
            }}></span>
          </div>
        </div>
      </div>
    )
  }
)

ActDocumentTemplate.displayName = 'ActDocumentTemplate'

export default ActDocumentTemplate

// Table cell styles
export const thStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '6px 8px',
  textAlign: 'center',
  fontWeight: 'bold',
  backgroundColor: '#fff',
}

export const tdStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '6px 8px',
  verticalAlign: 'top',
}

