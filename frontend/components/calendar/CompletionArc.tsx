'use client'

interface CompletionArcProps {
  percentage: number
  size: number
}

export function CompletionArc({ percentage, size }: CompletionArcProps) {
  const radius = size / 2 - 3
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const arcColor =
    percentage === 0
      ? 'transparent'
      : percentage < 40
      ? '#0FADA0'
      : percentage < 80
      ? '#F4A636'
      : '#FFFFFF'

  const glowFilter =
    percentage >= 80
      ? `drop-shadow(0 0 4px rgba(255,255,255,0.4))`
      : percentage >= 40
      ? `drop-shadow(0 0 4px rgba(244,166,54,0.4))`
      : 'none'

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0"
      style={{ filter: glowFilter }}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="2"
      />
      {/* Progress arc */}
      {percentage > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease',
          }}
        />
      )}
    </svg>
  )
}
