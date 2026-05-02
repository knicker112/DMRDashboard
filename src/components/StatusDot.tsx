interface StatusDotProps {
  active: boolean
}

export function StatusDot({ active }: StatusDotProps) {
  if (active) {
    return (
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
      </span>
    )
  }
  return <span className="inline-flex rounded-full h-3 w-3 bg-slate-600" />
}
