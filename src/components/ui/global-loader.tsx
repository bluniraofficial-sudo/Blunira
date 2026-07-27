export function GlobalLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#020509]/95 backdrop-blur-sm">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-r-emerald-400 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
      </div>
      <p className="mt-6 text-sm font-medium text-gray-400 animate-pulse">{text}</p>
    </div>
  );
}

export function InlineLoader({ size = 16 }: { size?: number }) {
  return (
    <div
      className="inline-block rounded-full border-2 border-current border-r-transparent animate-spin"
      style={{ width: size, height: size }}
    />
  );
}

export function OverlayLoader({ text = "Processing..." }: { text?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#020509]/80 backdrop-blur-sm rounded-2xl">
      <div className="w-10 h-10 rounded-full border-3 border-cyan-500/20 border-t-cyan-500 animate-spin" />
      <p className="mt-4 text-xs font-medium text-gray-400">{text}</p>
    </div>
  );
}