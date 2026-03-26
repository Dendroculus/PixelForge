import { IMAGES as img } from '../config';

export default function Header() {
  return (
    <div className="space-y-4">
          <img 
          src={img.darkLogo} 
          alt="Pixel Forge Logo" 
          className="mx-auto h-18 sm:h-10 md:h-40 w-auto object-contain"
        />
      <p className="text-lg text-slate-700 font-medium max-w-2xl mx-auto">
        Enhance your images instantly using Real-ESRGAN. Secure, fast, and completely free.
      </p>
    </div>
  );
}