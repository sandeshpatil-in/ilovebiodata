'use client'
import { useEffect, useRef, useState } from 'react'
import GoldFrame, { MinimalFrame } from './GoldFrame'
import GodIcon from './GodIcon'
import Watermark from './Watermark'
import { A4Paper, A4Viewer, A4_HEIGHT } from './A4Page'

// A single row of the biodata (label : value)
const Row = ({ label, value }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  return (
    <div className="bio-row">
      <div className="lbl">{label}</div>
      <div className="col">:</div>
      <div className="val">{Array.isArray(value) ? value.filter(Boolean).join(', ') : value}</div>
    </div>
  )
}

const SectionTitle = ({ children, color = '#B8860B' }) => (
  <div style={{ textAlign: 'center', color, fontWeight: 800, fontSize: 20, letterSpacing: '0.5px', padding: '8px 0 4px' }}>{children}</div>
)

// Internal content that renders the biodata rows. Isolated so we can auto-fit inside A4.
function BiodataContent({ data }) {
  const d = data || {}
  const godName = d.god?.name || 'श्री गणेश'
  const templeName = d.god?.temple
  const shlok = d.god?.shlok
  const relatives = d.relatives || {}
  const relItems = [
    ['मामा', relatives.mama], ['मामी', relatives.mami], ['काका', relatives.kaka], ['काकू', relatives.kaku],
    ['आत्या', relatives.atya], ['मावशी', relatives.mavshi], ['चुलते', relatives.chulte], ['आजोबा', relatives.ajoba], ['आजी', relatives.aji],
  ]
  const custom = d.customFields || []
  return (
    <div className="font-marathi" style={{ color: '#2b2b2b' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        {templeName && (
          <div style={{ color: '#7A1F1F', fontWeight: 700, fontSize: 15 }}>|| श्री {templeName} प्रसन्न ||</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 4 }}>
          <GodIcon name={godName} size={90} custom={d.god?.customImage} />
        </div>
        <div style={{ color: '#7A1F1F', fontWeight: 800, fontSize: 20, marginTop: 4 }}>|| श्री गणेशाय नमः ||</div>
        {shlok && <div style={{ color: '#7A1F1F', fontStyle: 'italic', marginTop: 2, fontSize: 13 }}>{shlok}</div>}
        <div style={{ color: '#B8860B', fontWeight: 800, fontSize: 26, marginTop: 4, letterSpacing: '1px' }}>परिचय पत्र</div>
      </div>

      {d.photo && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
          <img src={d.photo} alt="फोटो" style={{ width: 120, height: 150, objectFit: 'cover', border: '3px solid #B8860B', borderRadius: 6 }} />
        </div>
      )}

      <div>
        <Row label="नाव" value={[d.namePrefix, d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ')} />
        <Row label="जन्म तारीख" value={d.dob} />
        <Row label="जन्म वेळ" value={d.birthTime} />
        <Row label="जन्म स्थळ" value={d.birthPlace} />
        <Row label="राशी" value={d.rashi} />
        <Row label="नक्षत्र" value={d.nakshatra} />
        <Row label="गोत्र" value={d.gotra} />
        <Row label="गण" value={d.gan} />
        <Row label="नाडी" value={d.nadi} />
        <Row label="मंगळ" value={d.mangal} />
        <Row label="उंची" value={d.height} />
        <Row label="वजन" value={d.weight} />
        <Row label="रक्तगट" value={d.bloodGroup} />
        <Row label="वर्ण" value={d.complexion} />
        <Row label="कुळदैवत" value={d.kuldaivat} />
        <Row label="जात" value={[d.caste, d.subCaste].filter(Boolean).join(', ')} />
        <Row label="वैवाहिक स्थिती" value={d.maritalStatus} />
        <Row label="अपंगत्व" value={d.disability} />
        <Row label="छंद" value={d.hobbies} />

        <Row label="शिक्षण" value={[d.education, d.college].filter(Boolean).join(', ')} />
        <Row label="पदवी" value={d.degree} />
        <Row label="नोकरी" value={[d.job, d.company].filter(Boolean).join(', ')} />
        <Row label="व्यवसाय" value={d.business} />
        <Row label="वार्षिक उत्पन्न" value={d.annualIncome} />
        <Row label="मासिक उत्पन्न" value={d.monthlyIncome} />
        <Row label="शेती" value={d.farm} />
        <Row label="जमीन" value={d.land} />
        <Row label="घर" value={d.house} />
        <Row label="फ्लॅट" value={d.flat} />
        <Row label="वाहन" value={d.vehicle} />
        <Row label="इतर मालमत्ता" value={d.otherAssets} />
      </div>

      {Boolean(d.fatherName || d.motherName || (d.brothers && d.brothers.length) || (d.sisters && d.sisters.length) || d.familyCount) && (
        <>
          <SectionTitle>कौटुंबिक माहिती</SectionTitle>
          <Row label="वडिलांचे नाव" value={d.fatherName && `${d.fatherName}${d.fatherOccupation ? ', व्यवसाय - ' + d.fatherOccupation : ''}`} />
          <Row label="आईचे नाव" value={d.motherName && `${d.motherName}${d.motherOccupation ? ', व्यवसाय - ' + d.motherOccupation : ''}`} />
          {(d.brothers || []).map((b, i) => (
            <Row key={'b'+i} label={i===0? 'भाऊ' : ''} value={[b.name, b.wife && ('(पत्नी: '+b.wife+')')].filter(Boolean).join(' ')} />
          ))}
          {(d.sisters || []).map((s, i) => (
            <Row key={'s'+i} label={i===0? 'बहीण' : ''} value={[s.name, s.husband && ('(पती: '+s.husband+')')].filter(Boolean).join(' ')} />
          ))}
          <Row label="कुटुंबातील सदस्य" value={d.familyCount} />
        </>
      )}

      {relItems.some(([, v]) => v && v.length) && (
        <>
          {relItems.map(([label, list]) => (
            (list || []).filter(x => x?.trim()).map((val, idx) => (
              <Row key={label+idx} label={idx===0 ? label : ''} value={val} />
            ))
          ))}
        </>
      )}

      {custom.filter(c => c.name && c.value).length > 0 && (
        <>
          {custom.filter(c => c.name && c.value).map((c, i) => (
            <Row key={'c'+i} label={c.name} value={c.value} />
          ))}
        </>
      )}

      {(d.address || d.mobile || d.whatsapp || d.email) && (
        <>
          <SectionTitle>संपर्क</SectionTitle>
          <Row label="पत्ता" value={[d.address, d.village, d.taluka && ('ता. '+d.taluka), d.district && ('जि. '+d.district), d.state, d.pincode].filter(Boolean).join(', ')} />
          <Row label="मोबाईल नंबर" value={[d.mobile, d.mobile2].filter(Boolean).join(' / ')} />
          <Row label="WhatsApp" value={d.whatsapp} />
          <Row label="Email" value={d.email} />
        </>
      )}
    </div>
  )
}

// Auto-fit content: if content overflows the A4 area, scale it down proportionally.
function AutoFitContent({ data, availableHeight }) {
  const contentRef = useRef(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    // Reset to measure natural size
    el.style.transform = 'none'
    const h = el.scrollHeight
    if (h > availableHeight) {
      const s = availableHeight / h
      setScale(Math.max(0.5, s))
    } else {
      setScale(1)
    }
  }, [data, availableHeight])
  return (
    <div
      ref={contentRef}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: scale < 1 ? `${100 / scale}%` : '100%',
      }}
    >
      <BiodataContent data={data} />
    </div>
  )
}

// Public BiodataView renders content inside an A4 paper with optional viewer scaling and watermark.
// - `data`: form data
// - `template`: 't1' | 't2' | 't3'
// - `showWatermark`: boolean (guest/non-premium)
// - `scaled`: when true (default), wraps in A4Viewer that scales A4 paper to fit container width.
//             When false, renders A4Paper at its native pixel size (used for PDF capture).
// - `printMode`: disables shadow/borders on paper (for capture)
export default function BiodataView({ data, template = 't1', showWatermark = false, scaled = true, printMode = false }) {
  const Body = (
    <A4Paper printMode={printMode}>
      {template === 't3' ? (
        <MinimalFrame variant="t3">
          <AutoFitContent data={data} availableHeight={A4_HEIGHT - 120} />
        </MinimalFrame>
      ) : (
        <GoldFrame variant={template}>
          <AutoFitContent data={data} availableHeight={A4_HEIGHT - 130} />
        </GoldFrame>
      )}
      {showWatermark && <Watermark />}
    </A4Paper>
  )
  if (scaled) return <A4Viewer>{Body}</A4Viewer>
  return Body
}

// Miniature A4 preview used inside template gallery cards.
// Renders at ~40% of A4 to look like a real paper thumbnail.
export function BiodataThumb({ data, template = 't1', showWatermark = false, maxScale = 1 }) {
  return (
    <A4Viewer maxScale={maxScale}>
      <A4Paper>
        {template === 't3' ? (
          <MinimalFrame variant="t3">
            <AutoFitContent data={data} availableHeight={A4_HEIGHT - 120} />
          </MinimalFrame>
        ) : (
          <GoldFrame variant={template}>
            <AutoFitContent data={data} availableHeight={A4_HEIGHT - 130} />
          </GoldFrame>
        )}
        {showWatermark && <Watermark />}
      </A4Paper>
    </A4Viewer>
  )
}
