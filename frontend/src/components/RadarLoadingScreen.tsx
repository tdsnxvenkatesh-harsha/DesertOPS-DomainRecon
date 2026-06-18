import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'

interface RadarLoadingScreenProps {
  processed: number
  total: number
}

interface ScanHitBlip {
  id: number
  top: number
  left: number
}

const MAX_RADIUS_PERCENT = 42
const BLIP_VISIBLE_MS = 500
const BLIP_FADE_OUT_MS = 200
const HIT_BLIP_LIFETIME_MS = BLIP_VISIBLE_MS + BLIP_FADE_OUT_MS
// Fraction of the circle where the sweep gradient alpha stays above 0.5.
// Derived from the conic-gradient stops in theme.css (0.72 at 10%, 0.48 at 18%),
// which cross 0.5 at ~17.3% of the circle.
const BRIGHT_SWEEP_FRACTION = 0.17333
const BRIGHT_SWEEP_ARC_RAD = Math.PI * 2 * BRIGHT_SWEEP_FRACTION
// The conic gradient is measured clockwise from the top, while the blip
// placement below measures clockwise from the east, so convert frames.
const CONIC_TO_BLIP_OFFSET_RAD = Math.PI / 2

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

let blipIdCounter = 0

// Reads the sweep element's live rotation straight from its computed transform
// matrix, so the spawn angle is phase-locked to the actual CSS animation.
function getSweepRotationRad(element: HTMLElement | null): number {
  if (!element) {
    return 0
  }

  const transform = window.getComputedStyle(element).transform
  if (!transform || transform === 'none') {
    return 0
  }

  const match = transform.match(/matrix\(([^)]+)\)/)
  if (!match) {
    return 0
  }

  const [a, b] = match[1].split(',').map((value) => parseFloat(value))
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return 0
  }

  return Math.atan2(b, a)
}

function createScanHitBlip(sweepElement: HTMLElement | null): ScanHitBlip {
  blipIdCounter += 1
  const sweepRotation = getSweepRotationRad(sweepElement)
  // Spawn only within the high-opacity (>50%) leading wedge of the sweep,
  // converting from the conic gradient frame to the blip placement frame.
  const angle = sweepRotation + randomBetween(0, BRIGHT_SWEEP_ARC_RAD) - CONIC_TO_BLIP_OFFSET_RAD
  const radius = randomBetween(2, MAX_RADIUS_PERCENT)
  return {
    id: blipIdCounter,
    top: 50 + radius * Math.sin(angle),
    left: 50 + radius * Math.cos(angle),
  }
}

export function RadarLoadingScreen({ processed, total }: RadarLoadingScreenProps) {
  const [scanHitBlips, setScanHitBlips] = useState<ScanHitBlip[]>([])
  const previousProcessedRef = useRef(processed)
  const sweepRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = previousProcessedRef.current
    previousProcessedRef.current = processed

    const completedNow = processed - previous
    if (completedNow <= 0) {
      return
    }

    for (let index = 0; index < completedNow; index += 1) {
      const hitBlip = createScanHitBlip(sweepRef.current)
      setScanHitBlips((current) => [...current, hitBlip])

      window.setTimeout(() => {
        setScanHitBlips((current) => current.filter((item) => item.id !== hitBlip.id))
      }, HIT_BLIP_LIFETIME_MS)
    }
  }, [processed])

  return (
    <div className="radar-overlay" role="status" aria-live="polite" aria-label="analysis loading">
      <div className="radar-card">
        <div className="radar-screen">
          <div className="radar-grid" />
          <div className="radar-sweep" ref={sweepRef} />
          {scanHitBlips.map((blip) => (
            <div
              key={`hit-${blip.id}`}
              className="blip scan-hit-blip"
              style={
                {
                  top: `${blip.top}%`,
                  left: `${blip.left}%`,
                  '--blip-visible-ms': `${BLIP_VISIBLE_MS}ms`,
                  '--blip-fade-ms': `${BLIP_FADE_OUT_MS}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <p className="radar-text">Scanning domains... {processed}/{total}</p>
      </div>
    </div>
  )
}
