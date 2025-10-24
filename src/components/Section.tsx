export default function Section({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <section className={`py-12 sm:py-16 lg:py-20 ${className}`}>{children}</section>
}