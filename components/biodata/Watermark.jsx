'use client'

// Diagonal repeating watermark overlay for guest previews.
// Tiled at -30° rotation, ~10% opacity, non-interactive.
export default function Watermark({ text = 'ILoveBiodata.com  •  Preview Only', opacity = 0.09, color = '#7A1F1F' }) {
  const rows = 8
  const items = new Array(rows).fill(0)
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 20 }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-20%',
          width: '140%',
          height: '140%',
          transform: 'rotate(-30deg)',
          transformOrigin: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          opacity,
        }}
      >
        {items.map((_, i) => (
          <div
            key={i}
            style={{
              whiteSpace: 'nowrap',
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: 4,
              color,
              textAlign: 'center',
            }}
          >
            {text}   •   {text}   •   {text}
          </div>
        ))}
      </div>
    </div>
  )
}
