import { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import routes from './routes';
import Navbar from './components/NavBar';
import Footer from './components/Footer';
import LegalModal from './components/LegalModal';
import { legalModalData } from './data/legalModalData';

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[300px] w-full z-10">
    <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

export default function App() {
  const [modalState, setModalState] = useState({ isOpen: false, type: 'privacy' });

  const openModal = (type) => setModalState({ isOpen: true, type });
  const closeModal = () => setModalState((prev) => ({ ...prev, isOpen: false }));

  const activeModalData = legalModalData[modalState.type];

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-[#EEAECA] to-[#94BBE9] text-slate-800 flex flex-col overflow-hidden selection:bg-white/40">
        <Navbar />

        <main className="flex-1 min-h-0 relative w-full flex flex-col">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/40 blur-[150px] rounded-full pointer-events-none -z-10" />
          <div className="absolute top-[400px] right-0 w-[400px] h-[400px] bg-white/30 blur-[120px] rounded-full pointer-events-none -z-10" />

          <Suspense fallback={<PageLoader />}>
            <Routes>
              {routes.map((r) => {
                const Component = r.component;
                return <Route key={r.path} path={r.path} element={<Component />} />;
              })}
            </Routes>
          </Suspense>
        </main>

        <Footer openModal={openModal} />

        <LegalModal isOpen={modalState.isOpen} onClose={closeModal} title={activeModalData.title}>
          {activeModalData.content}
        </LegalModal>
      </div>
    </BrowserRouter>
  );
}