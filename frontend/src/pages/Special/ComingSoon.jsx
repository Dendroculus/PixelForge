import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

export default function ComingSoon() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex-1 min-h-0 relative w-full overflow-hidden px-6 pt-14 pb-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-130 h-130 bg-indigo-300/25 rounded-full blur-[110px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-105 h-105 bg-fuchsia-300/20 rounded-full blur-[100px]" />
      </div>

      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-xl mx-auto text-center rounded-3xl border border-white/70 bg-white/60 md:bg-white/50 md:backdrop-blur-xl shadow-xl shadow-indigo-500/5 p-8 sm:p-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-extrabold tracking-wide uppercase mb-5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
          </span>
          In Progress
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-3">
          Coming Soon
        </h1>

        <p className="text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
          We’re crafting this tool right now. It’ll be available very soon — polished, fast, and worth the wait.
        </p>

        <div className="mt-7 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
          >
            Back to Home
          </Link>

        </div>
      </motion.section>
    </div>
  );
}