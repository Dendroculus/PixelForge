import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="w-full flex flex-col relative z-10">

      <div className="grow flex items-center justify-center p-6">
        <div className="bg-white/40 backdrop-blur-2xl p-10 md:p-16 rounded-4xl border border-white/50 shadow-2xl shadow-slate-900/10 text-center max-w-lg w-full transform transition-all border-radius-2xl">
          
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-6 mb-3">
            Lost in the pixels! 👾
          </h2>
          
          <p className="text-slate-600 font-medium mb-8 text-sm md:text-base leading-relaxed">
            It looks like the page you are looking for got compressed into oblivion, or it never existed in the first place. 
          </p>

          <Link 
            to="/" 
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            Return to Safety
          </Link>

        </div>
      </div>
    </div>
  );
}