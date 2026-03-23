import { useState } from 'react';
import Home from './pages/Home';
import LegalModal from './components/LegalModal';
import { legalModalData } from './data/legalModalData';

export default function App() {
  const [modalState, setModalState] = useState({ isOpen: false, type: 'privacy' }); 

  const openModal = (type) => setModalState({ isOpen: true, type });
  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  const activeModalData = legalModalData[modalState.type];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEAECA] to-[#94BBE9] text-slate-800 flex flex-col overflow-x-hidden selection:bg-white/40">
      
      <nav className="w-full border-b border-white/30 bg-white/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="../public/PixelForgeAI.png" alt="Pixel Forge Logo" className="h-8 sm:h-10 md:h-8 w-auto object-contain block" />
              <img src="../public/PixelForgeAI_BlackText.png" alt="Pixel Forge Text" className="h-6 sm:h-7 md:h-4 w-auto object-contain block translate-y-[2px]" />
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-8 text-sm text-slate-700">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="https://github.com/Dendroculus/image-upscaler-website" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors flex items-center gap-1.5 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/40 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute top-[400px] right-0 w-[400px] h-[400px] bg-white/30 blur-[120px] rounded-full pointer-events-none"></div>
        <Home />
      </main>

      <footer className="w-full border-t border-white/30 bg-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <p>© 2026 Pixel Forge. Powered by Real-ESRGAN.</p>
          
          <div className="flex items-center gap-6 group font-medium">
            <button onClick={() => openModal('privacy')} className="transition-colors focus:outline-none group-hover:text-slate-400 hover:!text-slate-900">Privacy</button>
            <button onClick={() => openModal('terms')} className="transition-colors focus:outline-none group-hover:text-slate-400 hover:!text-slate-900">Terms</button>
            <a href="https://github.com/Dendroculus/image-upscaler-website" target="_blank" rel="noopener noreferrer" className="transition-colors focus:outline-none group-hover:text-slate-400 hover:!text-slate-900">Source Code</a>
          </div>
        </div>
      </footer>

      <LegalModal 
        isOpen={modalState.isOpen} 
        onClose={closeModal} 
        title={activeModalData.title}
      >
        {activeModalData.content}
      </LegalModal>

    </div>
  );
}