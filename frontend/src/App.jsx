import { useState } from 'react';
import Home from './pages/Home';
import Navbar from './components/NavBar';
import Footer from './components/Footer';
import LegalModal from './components/LegalModal';
import { legalModalData } from './data/legalModalData';

/**
 * Root layout component that renders navigation, home page, footer,
 * and legal modal content.
 *
 * @returns {JSX.Element}
 */
export default function App() {
  const [modalState, setModalState] = useState({ isOpen: false, type: 'privacy' });

  const openModal = (type) => setModalState({ isOpen: true, type });
  const closeModal = () => setModalState((prev) => ({ ...prev, isOpen: false }));

  const activeModalData = legalModalData[modalState.type];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEAECA] to-[#94BBE9] text-slate-800 flex flex-col overflow-x-hidden selection:bg-white/40">
      <Navbar />

      <main className="flex-1 flex flex-col items-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/40 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute top-[400px] right-0 w-[400px] h-[400px] bg-white/30 blur-[120px] rounded-full pointer-events-none"></div>

        <Home />
      </main>

      <Footer openModal={openModal} />

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