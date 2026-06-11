/**
 * LiveIndicator
 * A small pulsing green dot shown in the navbar to tell the user
 * that data is being updated live in the background.
 */
export default function LiveIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-xs text-emerald-400 font-medium hidden sm:inline">Live</span>
    </div>
  )
}
