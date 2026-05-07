import { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import routes from './routes';
import Navbar from './components/Layout/NavBar';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import NotFound from './pages/Special/NotFound';
import AppModals from './components/Common/AppModals';
import { legalModalData } from './data/modals/legalModalData';
import FaqChatbotWidget from './pages/Special/FaqChatbotWidget';

function GlobalHeader() {
  const location = useLocation();

  if (location.pathname === '/') {
    return null;
  }

  const headerConfig = {
    '/': {
      words: ['transform.', 'enhance.', 'edit.', 'optimize.'],
      subtitle:
        'All-in-one image studio for AI enhancements and everyday editing tools. Fast, simple, and built for creators.'
    },

    '/upscale': {
      words: ['upscale.', 'enhance.', 'enlarge.'],
      subtitle:
        'Increase image resolution with AI while preserving sharp details and clarity.'
    },
    '/remove-bg': {
      words: ['remove.', 'isolate.', 'transparent.'],
      subtitle:
        'Automatically remove image backgrounds in seconds for clean, professional cutouts.'
    },
    '/color-restoration': {
      words: ['restore.', 'revive.', 'colorize.'],
      subtitle:
        'Restore faded photos and bring old memories back to life with rich, natural color.'
    },

    // Smart edit / utility features (non-AI wording)
    '/image-editor': {
      words: ['edit.', 'adjust.', 'perfect.'],
      subtitle:
        'Fine-tune brightness, contrast, and more with an easy editor designed for quick results.'
    },
    '/resize-image': {
      words: ['resize.', 'scale.', 'fit.'],
      subtitle:
        'Resize images to exact dimensions for web, social media, print, or any custom layout.'
    },
    '/crop-image': {
      words: ['crop.', 'frame.', 'focus.'],
      subtitle:
        'Crop and reframe images to highlight what matters most with pixel-precise control.'
    },
    '/rotate-flip': {
      words: ['rotate.', 'flip.', 'align.'],
      subtitle:
        'Rotate and flip images instantly to correct orientation and composition.'
    },
    '/watermark-adder': {
      words: ['watermark.', 'brand.', 'protect.'],
      subtitle:
        'Add text or logo watermarks to protect your work and keep your brand visible.'
    },
    '/compress-image': {
      words: ['compress.', 'reduce.', 'optimize.'],
      subtitle:
        'Reduce file size while maintaining quality for faster loading and easier sharing.'
    },
    '/convert-format': {
      words: ['convert.', 'switch.', 'export.'],
      subtitle:
        'Convert images between popular formats quickly and reliably.'
    },
    '/metadata': {
      words: ['clean.', 'sanitize.', 'strip.'],
      subtitle:
        'Remove EXIF and hidden metadata from images to improve privacy before sharing.'
    },
    '/color-palette': {
      words: ['extract.', 'match.', 'create.'],
      subtitle:
        'Generate and explore color palettes from images for design, branding, and inspiration.'
    },

    // Special pages
    '/coming-soon': {
      titlePrefix: 'This page is still being forged.',
      words: ['coming soon.', 'in progress.', 'stay tuned.'],
      subtitle:
        'New tools are on the way. We’re building more features to expand your image workflow.'
    },

    '*': {
      titlePrefix: "Oops, this page doesn't exist.",
      words: ['not found.', 'wrong turn.', 'go home.'],
      subtitle:
        'The page you’re looking for isn’t available. Return to the homepage and keep exploring.'
    },
  };

  const currentConfig = headerConfig[location.pathname] || headerConfig['*'];

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

        <FaqChatbotWidget />

        <div className="mt-auto w-full relative z-50">
          <Footer openModal={openModal} />
        </div>

        <AppModals isOpen={modalState.isOpen} onClose={closeModal} title={activeModalData.title}>
          {activeModalData.content}
        </AppModals>
      </div>
    </BrowserRouter>
  );
}