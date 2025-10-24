export default function Container({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`mx-auto w-full max-w-wrapper px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}