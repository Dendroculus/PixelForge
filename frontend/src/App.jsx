/**
 * Root application shell for PixelForge.
 *
 * Responsibilities:
 * - Own the browser router.
 * - Render persistent layout chrome such as navigation, global header, footer,
 *   legal modals, and FAQ chatbot.
 * - Lazily render page routes with lightweight suspense loaders.
 */

import { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { legalModalData } from './data/modals/legalModalData';
import routes from './routes';

import Navbar from './components/Layout/Core/NavBar';
import GlobalHeader from './components/Layout/Core/GlobalHeader';
import Footer from './components/Layout/Core/Footer';
import NotFound from './pages/Special/NotFound';
import AppModals from './components/Common/AppModals';
import FaqChatbotWidget from './pages/Special/FaqChatbotWidget';

/**
 * Generic fallback shown while non-workspace pages are loading.
 *
 * @returns {JSX.Element} Centered loading spinner.
 */
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-75 w-full z-10">
    <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

/**
 * Workspace-shaped fallback used for heavier tool pages.
 *
 * This keeps the layout stable while feature bundles are being downloaded.
 *
 * @returns {JSX.Element} Skeleton-like workspace loading panel.
 */
const WorkspaceLoader = () => (
  <div className="w-full flex-1">
    <section className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-16">
      <div className="w-full min-h-96 rounded-3xl border border-white/70 bg-white/50 backdrop-blur-xl shadow-xl shadow-indigo-500/5 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    </section>
  </div>
);

/**
 * Main PixelForge application component.
 *
 * @returns {JSX.Element} Fully routed application shell.
 */
export default function App() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'privacy',
  });

  const openModal = (type) => setModalState({ isOpen: true, type });
  const closeModal = () =>
    setModalState((prev) => ({ ...prev, isOpen: false }));

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
                const FallbackLoader =
                  r.path === '/upscale' ? WorkspaceLoader : PageLoader;

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

        <AppModals
          isOpen={modalState.isOpen}
          onClose={closeModal}
          title={activeModalData.title}
        >
          {activeModalData.content}
        </AppModals>
      </div>
    </BrowserRouter>
  );
}
