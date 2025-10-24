import Container from './Container'

export default function HeroDark({
  title,
  kicker,
  children,
}: {
  title: string
  kicker?: string
  children?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ink via-slate to-panel" />
      <Container className="relative">
        <div className="py-16 sm:py-24 lg:py-28">
          {kicker && <p className="mb-3 text-sm font-medium text-accent/90">{kicker}</p>}
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">{title}</h1>
          {children && <div className="mt-4 text-lg text-white/70 max-w-prose">{children}</div>}
        </div>
      </Container>
    </div>
  )
}