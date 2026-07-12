'use client'
import { useEffect, useRef, useState } from 'react'

// A4 dimensions at 96 DPI - MUST match PDF output exactly
export const A4_WIDTH = 794
export const A4_HEIGHT = 1123

// A4Paper: fixed-size A4 container. Content inside is rendered at PIXEL EQUIVALENT of print.
// This is the SAME node used for on-screen preview and for html2canvas PDF capture,
// guaranteeing pixel-perfect identical output.
export function A4Paper({ children, className = '', style = {}, printMode = false, ...rest }) {
  return (
    <div
      className={`ilb-a4-paper bg-white relative ${printMode ? '' : 'shadow-[0_8px_32px_rgba(0,0,0,0.14)] ring-1 ring-black/5 rounded-sm'} ${className}`}
      style={{
        width: `${A4_WIDTH}px`,
        height: `${A4_HEIGHT}px`,
        overflow: 'hidden',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

// A4Viewer wraps the A4Paper and scales it visually (CSS transform)
// so it fits the parent container width while maintaining the exact 1:1.414 ratio.
// The A4Paper itself is always 794x1123px internally → PDF export uses those bytes 1:1.
export function A4Viewer({ children, className = '', maxScale = 1 }) {
  const wrapperRef = useRef(null)
  const [scale, setScale] = useState(0.5)
  useEffect(() => {
    const compute = () => {
      const el = wrapperRef.current
      if (!el) return
      const w = el.offsetWidth
      const s = Math.min(w / A4_WIDTH, maxScale)
      setScale(s || 0.5)
    }
    compute()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(compute) : null
    if (ro && wrapperRef.current) ro.observe(wrapperRef.current)
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('resize', compute)
      if (ro) ro.disconnect()
    }
  }, [maxScale])
  return (
    <div ref={wrapperRef} className={className} style={{ width: '100%' }}>
      <div style={{ height: A4_HEIGHT * scale, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: A4_WIDTH,
            height: A4_HEIGHT,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
