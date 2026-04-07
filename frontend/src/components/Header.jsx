import { IMAGES as img } from '../config';

export default function Header() {
  return (
    <div className="space-y-6 flex flex-col items-center">
      
      <div className="relative group cursor-pointer">
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-200 via-indigo-100 to-emerald-200 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-80 transition-opacity duration-700 ease-in-out -z-10"></div>
        
        <img 
          src={img.darkLogo} 
          alt="Pixel Forge Logo" 
          className="relative mx-auto h-16 sm:h-20 md:h-40 w-auto object-contain transform transition-all duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-1.5 group-hover:drop-shadow-xl"
        />
      </div>

      <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed px-4 text-center">
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-500 font-bold tracking-tight">
          Enhance, edit, and optimize your images in seconds
        </span>
        <span className="block mt-1.5 text-slate-500/90 text-base md:text-lg">
          — all in one place, fast, secure, and free.
        </span>
      </p>
      
    </div>
  );
}