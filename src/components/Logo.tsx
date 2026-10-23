/** PyQuery mark: a speech bubble holding a terminal prompt (>_), in Python blue and yellow. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pq-bubble" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b7fc4" />
          <stop offset="1" stopColor="#1f4f80" />
        </linearGradient>
      </defs>
      <path
        d="M14 6h36a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10H28l-12 9a1.5 1.5 0 0 1-2.4-1.2V50A10 10 0 0 1 4 40V16A10 10 0 0 1 14 6Z"
        fill="url(#pq-bubble)"
      />
      <path
        d="m19 20 10 8-10 8"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M33 37h13" stroke="#ffd43b" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="size-8" />
      <span className="font-display text-lg font-bold tracking-tight text-ink">PyQuery</span>
    </span>
  );
}
