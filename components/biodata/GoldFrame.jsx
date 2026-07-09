'use client'
// Decorative golden ornate frame - inspired by traditional Marathi biodata
// Uses SVG with corner flourishes (paisley/mango leaf) and side diamonds.

const CornerFlourish = ({ transform }) => (
  <g transform={transform}>
    {/* outer curl */}
    <path d="M2 90 C 2 40, 40 2, 90 2" fill="none" stroke="#B8860B" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M10 92 C 10 46, 46 10, 92 10" fill="none" stroke="#C9A24A" strokeWidth="1.2" strokeLinecap="round"/>
    {/* inner curl swirl */}
    <path d="M18 60 C 22 40, 40 22, 60 18 C 55 30, 42 42, 30 46 C 40 44, 52 40, 62 30" fill="none" stroke="#B8860B" strokeWidth="1.4" strokeLinecap="round"/>
    {/* leaf motif */}
    <path d="M32 78 C 42 70, 52 60, 60 48 C 54 62, 46 72, 36 82 Z" fill="#E8D8A8" opacity="0.9"/>
    <path d="M32 78 C 42 70, 52 60, 60 48" fill="none" stroke="#B8860B" strokeWidth="1" />
    {/* small leaves */}
    <path d="M70 22 C 80 22, 88 30, 88 40 C 82 36, 76 30, 72 24 Z" fill="#E8D8A8"/>
    <path d="M22 70 C 22 80, 30 88, 40 88 C 36 82, 30 76, 24 72 Z" fill="#E8D8A8"/>
    <circle cx="90" cy="90" r="3" fill="#B8860B"/>
  </g>
)

const SideDiamond = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 -14 L 12 0 L 0 14 L -12 0 Z" fill="#B8860B"/>
    <path d="M0 -8 L 7 0 L 0 8 L -7 0 Z" fill="#F6EFD4"/>
    <path d="M0 -34 L 0 -14" stroke="#B8860B" strokeWidth="1.5"/>
    <path d="M0 14 L 0 34" stroke="#B8860B" strokeWidth="1.5"/>
  </g>
)

export default function GoldFrame({ width = 800, height = 1130, children, variant = 't1' }) {
  // variant colors
  const colors = {
    t1: { outer: '#B8860B', inner: '#C9A24A', accent: '#E8D8A8' },
    t2: { outer: '#7A1F1F', inner: '#A83232', accent: '#E8B8B8' },
    t3: { outer: '#8A8A8A', inner: '#B0B0B0', accent: '#E5E5E5' },
  }
  const c = colors[variant] || colors.t1
  return (
    <div className="relative w-full" style={{ aspectRatio: `${width}/${height}` }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="none" className="absolute inset-0 pointer-events-none">
        {/* Double rectangle border */}
        <rect x="18" y="18" width={width - 36} height={height - 36} fill="none" stroke={c.outer} strokeWidth="3" rx="6"/>
        <rect x="30" y="30" width={width - 60} height={height - 60} fill="none" stroke={c.inner} strokeWidth="1.2" rx="4"/>
        {/* Corner flourishes */}
        <CornerFlourish transform="translate(22,22)" />
        <CornerFlourish transform={`translate(${width - 22} 22) scale(-1 1)`} />
        <CornerFlourish transform={`translate(22 ${height - 22}) scale(1 -1)`} />
        <CornerFlourish transform={`translate(${width - 22} ${height - 22}) scale(-1 -1)`} />
        {/* Side diamonds */}
        <SideDiamond x={22} y={height / 2} />
        <SideDiamond x={width - 22} y={height / 2} />
      </svg>
      <div className="relative" style={{ padding: '52px 44px' }}>
        {children}
      </div>
    </div>
  )
}

export function MinimalFrame({ children, variant = 't3' }) {
  const border = variant === 't2' ? '#7A1F1F' : variant === 't3' ? '#8A8A8A' : '#B8860B'
  return (
    <div className="relative w-full" style={{ border: `2px solid ${border}`, borderRadius: 8, padding: 24, background: '#fff' }}>
      <div style={{ border: `1px dashed ${border}`, borderRadius: 6, padding: 20 }}>{children}</div>
    </div>
  )
}
