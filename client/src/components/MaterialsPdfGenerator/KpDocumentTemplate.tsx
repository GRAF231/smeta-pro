import type { Material } from '../../types'
import { formatMoney, formatDateShortRu } from '../../utils/format'

interface KpDocumentTemplateProps {
  kpNumber: string
  kpDate: string
  executorName: string
  executorDetails: string
  validDays: string
  materials: Material[]
  grandTotal: number
  images: Record<string, string>
}

const tdStyleKP: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '6px 8px',
  verticalAlign: 'top',
  fontSize: '12px',
}

export default function KpDocumentTemplate({
  kpNumber,
  kpDate,
  executorName,
  executorDetails,
  validDays,
  materials,
  grandTotal,
  images,
}: KpDocumentTemplateProps) {
  return (
    <div
      style={{
        width: '794px',
        padding: '40px 50px',
        fontFamily: "'Times New Roman', 'DejaVu Serif', Georgia, serif",
        color: '#000',
        backgroundColor: '#fff',
        fontSize: '13px',
        lineHeight: '1.5',
        boxSizing: 'border-box',
      }}
    >
      {/* Header with logo */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', alignItems: 'flex-start' }}>
        {images.logo && (
          <div style={{ width: '80px', flexShrink: 0 }}>
            <img src={images.logo} alt="Логотип" style={{ maxWidth: '80px', maxHeight: '60px' }} />
          </div>
        )}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>{executorDetails}</div>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{executorName}</div>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', margin: '20px 0 25px 0', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '10px 0' }}>
        КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ {kpNumber ? `№ ${kpNumber}` : ''} от {formatDateShortRu(kpDate)}
      </div>

      {/* Materials table */}
      {materials.map((material, index) => (
        <div key={material.id} style={{ marginBottom: '3px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ ...tdStyleKP, textAlign: 'center', width: '50px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  {index === 0 ? '№ 1' : `№ ${index + 1}`}
                </th>
                <th style={{ ...tdStyleKP, textAlign: 'left', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Наименование</th>
                <th style={{ ...tdStyleKP, textAlign: 'center', width: '50px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Е.И.</th>
                <th style={{ ...tdStyleKP, textAlign: 'center', width: '80px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Цена</th>
                <th style={{ ...tdStyleKP, textAlign: 'center', width: '55px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Кол-во</th>
                <th style={{ ...tdStyleKP, textAlign: 'center', width: '90px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...tdStyleKP, textAlign: 'center', width: '50px' }}></td>
                <td style={{ ...tdStyleKP, fontWeight: 'bold' }}>{material.name}</td>
                <td style={{ ...tdStyleKP, textAlign: 'center', width: '50px' }}>{material.unit}</td>
                <td style={{ ...tdStyleKP, textAlign: 'right', width: '80px' }}>{formatMoney(material.price)}</td>
                <td style={{ ...tdStyleKP, textAlign: 'center', width: '55px' }}>{material.quantity}</td>
                <td style={{ ...tdStyleKP, textAlign: 'right', width: '90px', fontWeight: 'bold' }}>{formatMoney(material.total)}</td>
              </tr>
              {material.description && (
                <tr>
                  <td style={{ ...tdStyleKP, border: 'none' }}></td>
                  <td colSpan={5} style={{ ...tdStyleKP, border: 'none', fontSize: '11px', color: '#555', padding: '4px 8px 8px 8px' }}>
                    {material.brand && <span style={{ fontWeight: 'bold' }}>Бренд {material.brand} </span>}
                    {material.article && <span>Артикул {material.article} </span>}
                    {material.description}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}

      {/* Total */}
      <div style={{ marginTop: '20px', padding: '10px 0', borderTop: '2px solid #000', fontSize: '14px' }}>
        <div style={{ textAlign: 'right', fontWeight: 'bold' }}>Итого на сумму {formatMoney(grandTotal)} руб.</div>
      </div>

      {/* Validity */}
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#555' }}>
        Предложение действительно в течение {validDays || '10'} дней.
      </div>

      {/* Stamp & Signature area */}
      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', minHeight: '100px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#555', marginBottom: '5px' }}>{executorName}</div>
          {images.signature && <img src={images.signature} alt="" style={{ maxWidth: '100px', maxHeight: '50px' }} />}
        </div>
        {images.stamp && (
          <div style={{ position: 'absolute', left: '50%', bottom: '-10px', transform: 'translateX(-50%)' }}>
            <img src={images.stamp} alt="" style={{ maxWidth: '150px', maxHeight: '150px' }} />
          </div>
        )}
      </div>
    </div>
  )
}

