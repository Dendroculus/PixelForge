import { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import routes from './routes';
import Navbar from './components/NavBar';
import Header from './components/Header';
import Footer from './components/Footer';
import NotFound from './pages/Special/NotFound';
import LegalModal from './components/LegalModal';
import { legalModalData } from './data/legalModalData';

function GlobalHeader() {
  const location = useLocation();

  if (location.pathname === '/') {
    return null;
  }

  const headerConfig = {
    '/upscale': {
      words: ["upscale.", "enhance.", "enlarge."],
      subtitle: "High-performance AI tools for your images. No accounts, no waiting, and no complexity. Just upload and go."
    },
    '/metadata': {
      words: ["clean.", "sanitize.", "strip."],
      subtitle: "Instantly strip hidden EXIF data and camera settings from your photos for absolute privacy."
    }
  };

  const currentConfig = headerConfig[location.pathname] || {};

  return (
    <div className="pt-4 px-6 max-w-6xl mx-auto w-full relative z-10">
      <Header {...currentConfig} />
    </div>
  );
}

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-75 w-full z-10">
    <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const WorkspaceLoader = () => (
  <div className="w-full flex-1">
    <section className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-16">
      <div className="w-full min-h-96 rounded-3xl border border-white/70 bg-white/50 backdrop-blur-xl shadow-xl shadow-indigo-500/5 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    </section>
  </div>
);

export default function App() {
  const [modalState, setModalState] = useState({ isOpen: false, type: 'privacy' });

  const openModal = (type) => setModalState({ isOpen: true, type });
  const closeModal = () => setModalState((prev) => ({ ...prev, isOpen: false }));

  const activeModalData = legalModalData[modalState.type];

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-linear-to-br from-[#EEAECA] to-[#94BBE9] text-slate-800 flex flex-col overflow-x-hidden selection:bg-white/40">
        <Navbar />
        
        <main className="flex-1 min-h-0 relative w-full flex flex-col">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-150 bg-white/40 blur-3xl rounded-full pointer-events-none -z-10" />
          <div className="absolute top-100 right-0 w-100 h-100 bg-white/30 blur-3xl rounded-full pointer-events-none -z-10" />

          <GlobalHeader />

          <Suspense fallback={<PageLoader />}>
          <Routes>
            {routes.map((r) => {
              const Component = r.component;
              const FallbackLoader = r.path === '/upscale' ? WorkspaceLoader : PageLoader;
              
              return (
                <Route 
                  key={r.path} 
                  path={r.path} 
                  element={
                    <Suspense fallback={<FallbackLoader />}>
                      <Component />
                    </Suspense>
                  } 
                />
              );
            })}
            
            <Route 
              path="*" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <NotFound />
                </Suspense>
              } 
            />
          </Routes>
          </Suspense>
        </main>

        <div className="mt-auto w-full relative z-50">
          <Footer openModal={openModal} />
        </div>

        <LegalModal isOpen={modalState.isOpen} onClose={closeModal} title={activeModalData.title}>
          {activeModalData.content}
        </LegalModal>
      </div>
    </BrowserRouter>
  );
}