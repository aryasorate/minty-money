export function JarMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect x="16" y="5" width="32" height="9" rx="3.5" fill="#147d3c" />
      <path d="M12 20c0-3 2.5-5.5 5.5-5.5h29c3 0 5.5 2.5 5.5 5.5v31c0 4.5-3.5 8-8 8H20c-4.5 0-8-3.5-8-8z" fill="#16a34a" />
      <path d="M18 24h28v4H18z" fill="#4cbd78" opacity=".6" />
      <circle cx="26" cy="44" r="6.5" fill="#fbbf24" />
      <circle cx="38" cy="47" r="6.5" fill="#f59e0b" />
      <circle cx="33" cy="37" r="6.5" fill="#fcd34d" />
      <path d="M20 20v28" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <JarMark size={compact ? 30 : 36} />
      <div className="leading-none">
        <p className="text-[17px] font-extrabold tracking-tight text-ink">
          Minty <span className="text-brand-600">Money</span>
        </p>
        {!compact && <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Smart · Simple · Student-first</p>}
      </div>
    </div>
  )
}
