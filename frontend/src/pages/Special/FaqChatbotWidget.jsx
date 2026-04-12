import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const FAQ_DATA = [
  {
    id: 'howto',
    icon: '🛠️',
    title: 'How-to (User Intent)',
    questions: [
      { q: 'How to upscale an image?', a: 'Navigate to the "Upscale Image" tool, upload your file, and click enhance. Our AI will automatically increase the resolution by 4x without losing quality.' },
      { q: 'How to remove background?', a: 'Go to the "Remove Background" tool. Once you upload an image, the AI will instantly extract the main subject and give you a transparent PNG.' },
      { q: 'Supported file formats?', a: 'We currently support JPG, PNG, and WEBP formats for all our tools.' }
    ]
  },
  {
    id: 'troubleshoot',
    icon: '⚠️',
    title: 'Troubleshooting',
    questions: [
      { q: 'Why is my image blurry after upload?', a: 'This usually happens if the original image is very low resolution. Try running it through our Upscale tool first!' },
      { q: 'Why processing takes time?', a: 'AI features (like Upscale and Background Removal) require heavy computational power. Most images process in 5-10 seconds depending on server load.' },
      { q: 'Max file size?', a: 'The maximum file size for all image uploads is 10MB.' }
    ]
  },
  {
    id: 'trust',
    icon: '🔐',
    title: 'Trust & Transparency',
    questions: [
      { q: 'Is this free?', a: 'Yes! Core features are currently free to use while we are in development.' },
      { q: 'Do you store my images?', a: 'No, we respect your privacy. All processing is done securely, and your images are not used to train external models.' },
      { q: 'How long are images saved?', a: 'Images are deleted from our servers immediately after you download your results or close your session.' }
    ]
  }
];

export default function FaqChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  
  // State Machine: 'menu' | 'category' | 'answer'
  const [view, setView] = useState('menu');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);

  // Navigation Helpers
  const handleOpenCategory = (category) => {
    setActiveCategory(category);
    setView('category');
  };

  const handleOpenQuestion = (qa) => {
    setActiveQuestion(qa);
    setView('answer');
  };

  const handleBack = () => {
    if (view === 'answer') setView('category');
    else if (view === 'category') setView('menu');
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset view after animation finishes
    setTimeout(() => {
      setView('menu');
      setActiveCategory(null);
      setActiveQuestion(null);
    }, 300);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden mb-4 flex flex-col"
            style={{ height: '450px' }}
          >
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h3 className="font-bold text-sm leading-tight">PixelForge Guide</h3>
                  <p className="text-[10px] text-indigo-200 font-medium">Instant Help & FAQ</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="text-indigo-200 hover:text-white transition-colors p-1 rounded-md hover:bg-indigo-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 relative">
              
              {/* VIEW 1: Main Menu */}
              {view === 'menu' && (
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-sm text-slate-700">
                    Hi there! 👋 What do you need help with today?
                  </div>
                  <div className="space-y-2">
                    {FAQ_DATA.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleOpenCategory(cat)}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3 hover:border-indigo-300 hover:shadow-md transition-all text-left"
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="font-medium text-slate-700 text-sm flex-1">{cat.title}</span>
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW 2: Category Questions */}
              {view === 'category' && activeCategory && (
                <div className="space-y-4">
                  <button 
                    onClick={handleBack}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-wide"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Menu
                  </button>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-sm text-slate-700 font-medium flex items-center gap-2">
                    {activeCategory.icon} {activeCategory.title}
                  </div>
                  <div className="space-y-2">
                    {activeCategory.questions.map((qa, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOpenQuestion(qa)}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left text-sm text-indigo-700 font-medium"
                      >
                        {qa.q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW 3: Answer */}
              {view === 'answer' && activeQuestion && (
                <div className="space-y-4">
                  <button 
                    onClick={handleBack}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-wide"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Questions
                  </button>
                  
                  {/* User Question Bubble */}
                  <div className="flex justify-end">
                    <div className="bg-indigo-100 text-indigo-900 p-3 rounded-2xl rounded-tr-sm text-sm max-w-[85%] font-medium">
                      {activeQuestion.q}
                    </div>
                  </div>

                  {/* Bot Answer Bubble */}
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 shadow-sm text-slate-700 p-4 rounded-2xl rounded-tl-sm text-sm max-w-[95%] leading-relaxed">
                      {activeQuestion.a}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB (Floating Action Button) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center relative group"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  );
}