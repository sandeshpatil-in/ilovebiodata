'use client'
// Simple stylized god icon rendered as an SVG medallion with Devanagari initial
export default function GodIcon({ name = 'गणपती', size = 96, custom }) {
  if (custom) {
    return <img src={custom} alt={name} style={{ width: size, height: size, objectFit: 'contain' }} />
  }
  const label = name?.[0] || 'ॐ'
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <defs>
        <radialGradient id="gold" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#F6E27A"/>
          <stop offset="55%" stopColor="#C9A24A"/>
          <stop offset="100%" stopColor="#8A6612"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#gold)" stroke="#7A5A10" strokeWidth="2"/>
      <circle cx="60" cy="60" r="46" fill="none" stroke="#FFF7D8" strokeWidth="1.2"/>
      {/* rays */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i * Math.PI) / 8
        const x1 = 60 + Math.cos(a) * 54
        const y1 = 60 + Math.sin(a) * 54
        const x2 = 60 + Math.cos(a) * 60
        const y2 = 60 + Math.sin(a) * 60
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round"/>
      })}
      <text x="60" y="74" textAnchor="middle" fontFamily="Noto Sans Devanagari, serif" fontSize="46" fontWeight="700" fill="#5A3E0A">{label}</text>
    </svg>
  )
}
