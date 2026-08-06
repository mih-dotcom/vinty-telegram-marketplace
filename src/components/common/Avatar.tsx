export function Avatar({
  src,
  name,
  size = 40,
}: {
  src?: string
  name: string
  size?: number
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center font-bold cta-gradient text-white shrink-0 border border-white/20"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
