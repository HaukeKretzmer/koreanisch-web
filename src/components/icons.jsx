const common = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function ReviewIcon() {
  return (
    <svg {...common}>
      <rect x="3" y="5" width="14" height="18" rx="2" transform="rotate(-8 10 14)" />
      <path d="M8 10h6M8 14h6M8 18h4" />
    </svg>
  )
}

export function LessonsIcon() {
  return (
    <svg {...common}>
      <path d="M4 5.5C4 4.67 4.67 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5z" />
    </svg>
  )
}

export function ImportIcon() {
  return (
    <svg {...common}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

export function StatsIcon() {
  return (
    <svg {...common}>
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  )
}

export function TestIcon() {
  return (
    <svg {...common}>
      <path d="M9 11l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}
