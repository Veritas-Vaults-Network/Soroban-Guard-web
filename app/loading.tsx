export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg
          className="spinner h-10 w-10 text-indigo-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
        </svg>
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    </div>
  )
}
