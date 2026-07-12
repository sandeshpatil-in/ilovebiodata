'use client'
import { A4_WIDTH, A4_HEIGHT } from './A4Page'

// Decorative golden ornate frame that PRECISELY fills an A4 page.
// Renders SVG viewBox at A4 pixel dimensions (794x1123) so borders align exactly.

const CornerFlourish = ({ transform, stroke = '#B8860B', accent = '#E8D8A8', highlight = '#C9A24A' }) => (
  <g transform={transform}>
    <path d="M2 90 C 2 40, 40 2, 90 2" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M10 92 C 10 46, 46 10, 92 10" fill="none" stroke={highlight} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M18 60 C 22 40, 40 22, 60 18 C 55 30, 42 42, 30 46 C 40 44, 52 40, 62 30" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M32 78 C 42 70, 52 60, 60 48 C 54 62, 46 72, 36 82 Z" fill={accent} opacity="0.9"/>
    <path d="M32 78 C 42 70, 52 60, 60 48" fill="none" stroke={stroke} strokeWidth="1" />
    <path d="M70 22 C 80 22, 88 30, 88 40 C 82 36, 76 30, 72 24 Z" fill={accent}/>
    <path d="M22 70 C 22 80, 30 88, 40 88 C 36 82, 30 76, 24 72 Z" fill={accent}/>
    <circle cx="90" cy="90" r="3" fill={stroke}/>
  </g>
)

const SideDiamond = ({ x, y, color = '#B8860B' }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 -14 L 12 0 L 0 14 L -12 0 Z" fill={color}/>
    <path d="M0 -8 L 7 0 L 0 8 L -7 0 Z" fill="#F6EFD4"/>
    <path d="M0 -34 L 0 -14" stroke={color} strokeWidth="1.5"/>
    <path d="M0 14 L 0 34" stroke={color} strokeWidth="1.5"/>
  </g>
)

const PALETTES = {
  t1: { outer: '#B8860B', inner: '#C9A24A', accent: '#E8D8A8', bg: '#FFFDF7' },
  t2: { outer: '#7A1F1F', inner: '#A83232', accent: '#E8B8B8', bg: '#FFFBFA' },
  t3: { outer: '#8A8A8A', inner: '#B0B0B0', accent: '#E5E5E5', bg: '#FFFFFF' },
}

export default function GoldFrame({ children, variant = 't1', padding = { top: 60, right: 54, bottom: 60, left: 54 } }) {
  const c = PALETTES[variant] || PALETTES.t1
  return (
    <div
      className="relative"
      style={{ width: A4_WIDTH, height: A4_HEIGHT, background: c.bg }}
    >
      <svg
        viewBox={`0 0 ${A4_WIDTH} ${A4_HEIGHT}`}
        width={A4_WIDTH}
        height={A4_HEIGHT}
        className="absolute inset-0 pointer-events-none"
      >
        <rect x="22" y="22" width={A4_WIDTH - 44} height={A4_HEIGHT - 44} fill="none" stroke={c.outer} strokeWidth="3" rx="6"/>
        <rect x="34" y="34" width={A4_WIDTH - 68} height={A4_HEIGHT - 68} fill="none" stroke={c.inner} strokeWidth="1.2" rx="4"/>
        <CornerFlourish transform="translate(26,26)" stroke={c.outer} accent={c.accent} highlight={c.inner}/>
        <CornerFlourish transform={`translate(${A4_WIDTH - 26} 26) scale(-1 1)`} stroke={c.outer} accent={c.accent} highlight={c.inner}/>
        <CornerFlourish transform={`translate(26 ${A4_HEIGHT - 26}) scale(1 -1)`} stroke={c.outer} accent={c.accent} highlight={c.inner}/>
        <CornerFlourish transform={`translate(${A4_WIDTH - 26} ${A4_HEIGHT - 26}) scale(-1 -1)`} stroke={c.outer} accent={c.accent} highlight={c.inner}/>
        <SideDiamond x={26} y={A4_HEIGHT / 2} color={c.outer}/>
        <SideDiamond x={A4_WIDTH - 26} y={A4_HEIGHT / 2} color={c.outer}/>
      </svg>
      <div
        className="relative"
        style={{
          position: 'absolute',
          top: padding.top,
          right: padding.right,
          bottom: padding.bottom,
          left: padding.left,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function MinimalFrame({ children, variant = 't3' }) {
  const border = variant === 't2' ? '#7A1F1F' : variant === 't3' ? '#8A8A8A' : '#B8860B'
  return (
    <div className="relative" style={{ width: A4_WIDTH, height: A4_HEIGHT, background: '#FFFFFF', padding: 30, boxSizing: 'border-box' }}>
      <div style={{ border: `2px solid ${border}`, borderRadius: 8, padding: 22, height: '100%', boxSizing: 'border-box' }}>
        <div style={{ border: `1px dashed ${border}`, borderRadius: 6, padding: 18, height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  )
}
