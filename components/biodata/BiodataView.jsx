'use client'
import GoldFrame, { MinimalFrame } from './GoldFrame'
import GodIcon from './GodIcon'

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
  <div style={{ textAlign: 'center', color, fontWeight: 800, fontSize: 22, letterSpacing: '0.5px', padding: '10px 0 6px', textShadow: '0 1px 0 rgba(0,0,0,0.02)' }}>{children}</div>
)

export default function BiodataView({ data, template = 't1', innerRef }) {
  const d = data || {}
  const godName = d.god?.name || 'श्री गणेश'
  const templeName = d.god?.temple
  const shlok = d.god?.shlok

  // Compose header lines
  const headerLines = []
  if (d.god?.kuldaivatLine) headerLines.push(d.god.kuldaivatLine)
  headerLines.push('|| श्री गणेशाय नमः ||')

  const relatives = d.relatives || {}
  const relItems = [
    ['मामा', relatives.mama], ['मामी', relatives.mami], ['काका', relatives.kaka], ['काकू', relatives.kaku],
    ['आत्या', relatives.atya], ['मावशी', relatives.mavshi], ['चुलते', relatives.chulte], ['आजोबा', relatives.ajoba], ['आजी', relatives.aji],
  ]

  const custom = d.customFields || []

  const Content = (
    <div ref={innerRef} className="font-marathi" style={{ color: '#2b2b2b' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        {templeName && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ color: '#7A1F1F', fontWeight: 700, fontSize: 16 }}>|| श्री {templeName} प्रसन्न ||</div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 4 }}>
          <GodIcon name={godName} size={96} custom={d.god?.customImage} />
        </div>
        <div style={{ color: '#7A1F1F', fontWeight: 800, fontSize: 20, marginTop: 4 }}>|| श्री गणेशाय नमः ||</div>
        {shlok && <div style={{ color: '#7A1F1F', fontStyle: 'italic', marginTop: 2, fontSize: 14 }}>{shlok}</div>}
        <div style={{ color: '#B8860B', fontWeight: 800, fontSize: 26, marginTop: 6, letterSpacing: '1px' }}>परिचय पत्र</div>
      </div>

      {/* Photo (optional top right / center) */}
      {d.photo && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, marginBottom: 8 }}>
          <img src={d.photo} alt="फोटो" style={{ width: 130, height: 160, objectFit: 'cover', border: '3px solid #B8860B', borderRadius: 6 }} />
        </div>
      )}

      {/* Basic Info */}
      <div style={{ marginTop: 8 }}>
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

        {/* Education & Job */}
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

      {/* Family */}
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

      {/* Relatives */}
      {relItems.some(([, v]) => v && v.length) && (
        <>
          {relItems.map(([label, list]) => (
            (list || []).filter(x => x?.trim()).map((val, idx) => (
              <Row key={label+idx} label={idx===0 ? label : ''} value={val} />
            ))
          ))}
        </>
      )}

      {/* Custom fields */}
      {custom.filter(c => c.name && c.value).length > 0 && (
        <>
          {custom.filter(c => c.name && c.value).map((c, i) => (
            <Row key={'c'+i} label={c.name} value={c.value} />
          ))}
        </>
      )}

      {/* Contact */}
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

  if (template === 't3') {
    return <MinimalFrame variant="t3">{Content}</MinimalFrame>
  }
  return <GoldFrame variant={template}>{Content}</GoldFrame>
}
