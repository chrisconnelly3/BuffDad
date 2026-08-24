export default function Splash({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-navy">
      <img src="/splash.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-navy via-navy/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] text-center">
        <h1 className="text-5xl font-black tracking-[.2em] text-white">BUFFDAD</h1>
        <p className="mt-2 text-lg text-white/80">Results may vary.</p>
        <button onClick={onContinue}
          className="mx-auto mt-7 block min-h-14 w-full max-w-xs rounded-2xl bg-teal px-6 py-4 text-xl font-extrabold tracking-wide text-white shadow-lg active:scale-[.98]">
          Continue
        </button>
      </div>
    </div>
  )
}
