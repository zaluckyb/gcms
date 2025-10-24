import Container from './Container'

export default function PostHeader({
  title,
  excerpt,
  date,
}: {
  title: string
  excerpt?: string
  date: string
}) {
  const displayDate = (() => {
    try {
      return new Date(date).toLocaleDateString()
    } catch {
      return date
    }
  })()

  return (
    <div className="relative border-b border-line bg-gradient-to-br from-ink via-slate to-panel">
      {/* subtle radial accent glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(1000px 400px at 10% -20%, rgba(18,181,229,0.18), transparent)',
        }}
      />
      <Container>
        <div className="py-14 sm:py-20">
          <time className="text-sm text-white/60">{displayDate}</time>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight text-white">{title}</h1>
          {excerpt && (
            <p className="mt-4 max-w-prose text-lg leading-relaxed text-white/70">{excerpt}</p>
          )}
        </div>
      </Container>
    </div>
  )
}