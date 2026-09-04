// lucide-react dropped brand glyphs in v1, so the four network marks are inlined.
const PATHS = {
  facebook:
    'M14 8.5h2.5V5.6h-2.6C11 5.6 9.6 7.3 9.6 9.6v1.9H7.5V14h2.1v6.4h2.9V14h2.4l.4-2.5h-2.8V9.5c0-.6.4-1 1-1Z',
  instagram:
    'M8.6 3.8h6.8a4.8 4.8 0 0 1 4.8 4.8v6.8a4.8 4.8 0 0 1-4.8 4.8H8.6a4.8 4.8 0 0 1-4.8-4.8V8.6a4.8 4.8 0 0 1 4.8-4.8Zm0 1.9a2.9 2.9 0 0 0-2.9 2.9v6.8a2.9 2.9 0 0 0 2.9 2.9h6.8a2.9 2.9 0 0 0 2.9-2.9V8.6a2.9 2.9 0 0 0-2.9-2.9H8.6Zm3.4 2.4a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2Zm0 1.9a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4Zm4.4-2.6a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z',
  x: 'M4.2 4h4.3l3.4 4.6L15.8 4h3.9l-5.4 6.7 5.7 9.3h-4.3l-3.6-5-4.2 5H4l6-7.3L4.2 4Zm2.5 1.5 9.1 13h1.8L8.5 5.5H6.7Z',
  youtube:
    'M20.2 8.3a2.6 2.6 0 0 0-1.8-1.8C16.8 6 12 6 12 6s-4.8 0-6.4.5A2.6 2.6 0 0 0 3.8 8.3C3.4 10 3.4 12 3.4 12s0 2 .4 3.7a2.6 2.6 0 0 0 1.8 1.8C7.2 18 12 18 12 18s4.8 0 6.4-.5a2.6 2.6 0 0 0 1.8-1.8c.4-1.7.4-3.7.4-3.7s0-2-.4-3.7ZM10.3 15V9l5.2 3-5.2 3Z',
}

export default function SocialIcon({ network }) {
  const path = PATHS[network]
  if (!path) return null

  return (
    <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={path} fill="currentColor" />
    </svg>
  )
}
