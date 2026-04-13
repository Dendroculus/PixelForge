import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IMAGES as img } from '../../config';

const FAQ_DATA = [
  {
    id: 'getting-started',
    icon: '🚀',
    title: 'Getting Started',
    description: 'Quick setup and first-time usage',
    questions: [
      {
        q: 'What is PixelForge?',
        a: 'PixelForge is an AI-powered image enhancement platform with tools like image upscaling and background removal to help creators improve visuals quickly.'
      },
      {
        q: 'How do I use PixelForge for the first time?',
        a: 'Pick a tool from the home screen, upload your image, run processing, then download the result.'
      },
      {
        q: 'Do I need to create an account?',
        a: 'Core features are available with minimal onboarding while PixelForge is in active development.'
      }
    ]
  },
  {
    id: 'tools',
    icon: '🛠️',
    title: 'Tools & Features',
    description: 'How each tool works',
    questions: [
      {
        q: 'How do I upscale an image?',
        a: 'Open Upscale Image, upload your file, and process. PixelForge enhances resolution while preserving details.'
      },
      {
        q: 'How do I remove background?',
        a: 'Open Remove Background, upload your image, and AI isolates the subject automatically.'
      },
      {
        q: 'Which formats are supported?',
        a: 'JPG, PNG, and WEBP are supported.'
      },
      {
        q: 'What is the max upload size?',
        a: 'Current upload limit is 10MB per image.'
      }
    ]
  },
  {
    id: 'quality',
    icon: '✨',
    title: 'Image Quality',
    description: 'Best output tips',
    questions: [
      {
        q: 'Why is output still blurry?',
        a: 'Very low-resolution originals have limits. Use the cleanest source image possible and upscale first.'
      },
      {
        q: 'How can I get best results?',
        a: 'Use well-lit, less compressed images. Better input gives better AI output.'
      }
    ]
  },
  {
    id: 'privacy',
    icon: '🔐',
    title: 'Privacy & Safety',
    description: 'Data & trust',
    questions: [
      {
        q: 'Do you store my uploaded images?',
        a: 'PixelForge is privacy-focused: images are processed securely and are not used for external model training.'
      },
      {
        q: 'How long are files kept?',
        a: 'Files are removed after result delivery/session completion based on current backend flow.'
      }
    ]
  }
];

const QUICK_ACTIONS = [
  'How do I upscale an image?',
  'How do I remove background?',
  'Which formats are supported?',
  'What is the max upload size?'
];

// Per-category accent gradients
const CAT_ACCENT = {
  'getting-started': {
    bg: 'linear-gradient(135deg, #7c3aed 0%, #d946ef 100%)',
    glow: 'rgba(124,58,237,0.55)',
    pill: 'rgba(124,58,237,0.15)',
    pillBorder: 'rgba(124,58,237,0.3)',
  },
  'tools': {
    bg: 'linear-gradient(135deg, #0891b2 0%, #3b82f6 100%)',
    glow: 'rgba(8,145,178,0.55)',
    pill: 'rgba(8,145,178,0.15)',
    pillBorder: 'rgba(8,145,178,0.3)',
  },
  'quality': {
    bg: 'linear-gradient(135deg, #d97706 0%, #f97316 100%)',
    glow: 'rgba(217,119,6,0.55)',
    pill: 'rgba(217,119,6,0.15)',
    pillBorder: 'rgba(217,119,6,0.3)',
  },
  'privacy': {
    bg: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    glow: 'rgba(5,150,105,0.55)',
    pill: 'rgba(5,150,105,0.15)',
    pillBorder: 'rgba(5,150,105,0.3)',
  },
};

const WIDGET_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .fw { font-family: 'DM Sans', sans-serif; }
  .fw-display { font-family: 'Syne', sans-serif; }

  .fw-scroll::-webkit-scrollbar { width: 3px; }
  .fw-scroll::-webkit-scrollbar-track { background: transparent; }
  .fw-scroll::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.35); border-radius: 99px; }
  .fw-scroll:hover::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.6); }

  @keyframes fw-dot-pop {
    0%, 100% { transform: translateY(0px); opacity: 0.6; }
    50%       { transform: translateY(-5px); opacity: 1; }
  }
  .fw-dot { animation: fw-dot-pop 0.85s ease-in-out infinite; }
  .fw-dot:nth-child(2) { animation-delay: 0.17s; }
  .fw-dot:nth-child(3) { animation-delay: 0.34s; }

  @keyframes fw-online-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
  .fw-online { animation: fw-online-blink 2.4s ease-in-out infinite; }
`;

const TypingDots = () => (
  <div className="inline-flex items-center gap-1.25 px-0.5">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="fw-dot w-2 h-2 rounded-full"
        style={{
          background: `hsl(${270 + i * 22}, 80%, 72%)`,
          boxShadow: `0 0 7px hsl(${270 + i * 22}, 80%, 60%)`,
        }}
      />
    ))}
  </div>
);

const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
    style={{ color: 'rgba(167,139,250,0.7)' }}
    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(192,172,255,1)')}
    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(167,139,250,0.7)')}
  >
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
    Back
  </button>
);

export default function FaqChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('home'); // home | category | search | answer
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const bodyRef = useRef(null);
  const typingTimerRef = useRef(null);

  const allQuestions = useMemo(
    () =>
      FAQ_DATA.flatMap((cat) =>
        cat.questions.map((qa) => ({ ...qa, category: cat.title, icon: cat.icon, categoryId: cat.id }))
      ),
    []
  );

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allQuestions.filter(
      (item) =>
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query, allQuestions]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [view, isTyping, showAnswer]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const startAnswerFlow = (qa) => {
    setActiveQuestion(qa);
    setView('answer');
    setIsTyping(true);
    setShowAnswer(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setShowAnswer(true);
    }, 1100);
  };

  const openCategory = (category) => {
    setActiveCategory(category);
    setView('category');
  };

  const openFromQuickAction = (text) => {
    const found = allQuestions.find((q) => q.q.toLowerCase() === text.toLowerCase());
    if (found) startAnswerFlow(found);
  };

  const handleBack = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setIsTyping(false);
    setShowAnswer(false);
    if (view === 'answer' && query.trim()) return setView('search');
    if (view === 'answer') return setView('category');
    if (view === 'category' || view === 'search') return setView('home');
  };

  const handleClose = () => {
    setIsOpen(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setTimeout(() => {
      setView('home');
      setActiveCategory(null);
      setActiveQuestion(null);
      setQuery('');
      setIsTyping(false);
      setShowAnswer(false);
    }, 180);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WIDGET_STYLES }} />

      <div className="fixed bottom-10 md:bottom-5 right-5 flex flex-col items-end z-999 fw text-slate-800">
        <AnimatePresence>
          {isOpen && (
          <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mb-3 w-95 max-w-[calc(100vw-24px)] h-[78vh] max-h-170 min-h-130 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
              style={{
                background: 'linear-gradient(to bottom right, #EEAECA, #94BBE9)', // Matches your App.jsx wallpaper
                border: '1px solid rgba(255,255,255,0.6)',
              }}
            >
              {/* ── HEADER ───────────────────────────────────── */}
              <div
                className="relative shrink-0 p-4 pb-4 overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.4)', // Light glass header
                  backdropFilter: 'blur(12px)',
                  borderBottom: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div
                        className="absolute -inset-0.5 rounded-full"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #d946ef)', opacity: 0.8 }}
                      />
                      <img
                        src={img.chatbotIcon}
                        alt="PixelForge Assistant"
                        className="relative w-10 h-10 rounded-full object-cover z-10"
                      />
                      <span
                        className="fw-online absolute bottom-0 right-0 z-20 w-2.5 h-2.5 rounded-full"
                        style={{
                          background: '#34d399',
                          border: '2px solid #ffffff',
                        }}
                      />
                    </div>
                    <div className="min-w-2">
                      <h3 className="fw-display text-sm font-bold leading-tight text-slate-800 truncate tracking-tight">
                        PixelForge Assistant
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-white/40 hover:bg-white/60 border border-white/50"
                    aria-label="Close chatbot"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Search bar */}
                <div className="relative mt-4">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { setSearchFocused(true); setView('search'); }}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Ask anything about PixelForge..."
                    className="w-full rounded-2xl text-sm pl-10 pr-14 py-2.5 outline-none text-slate-800 transition-all placeholder:text-slate-500"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      border: searchFocused
                        ? '1px solid rgba(139,92,246,0.7)'
                        : '1px solid rgba(255,255,255,0.8)',
                      boxShadow: searchFocused
                        ? '0 0 0 3px rgba(124,58,237,0.15)'
                        : 'none',
                    }}
                  />
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.85-4.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                  </svg>
                  {query && (
                    <button
                      onClick={() => { setQuery(''); setView('home'); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all text-slate-600 bg-white/50 hover:bg-white/80"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* ── BODY ─────────────────────────────────────── */}
              <div
                ref={bodyRef}
                className="flex-1 overflow-y-auto fw-scroll px-3 py-3"
                style={{ background: 'transparent' }}
              >
                {/* HOME VIEW */}
                {view === 'home' && (
                  <div className="space-y-2.5">
                    {/* Welcome card */}
                    <div
                      className="rounded-2xl p-4"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.4))',
                        border: '1px solid rgba(255,255,255,0.8)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                      }}
                    >
                      <p className="text-sm font-semibold text-slate-800">Hey there 👋</p>
                      <p className="text-xs mt-1 leading-relaxed text-slate-600">
                        Need help with PixelForge? Ask anything, pick a topic, or use a quick action below.
                      </p>
                    </div>

                    {/* Quick actions */}
                    <div
                      className="rounded-2xl p-3.5"
                      style={{
                        background: 'rgba(255,255,255,0.4)',
                        border: '1px solid rgba(255,255,255,0.6)',
                      }}
                    >
                      <p
                        className="text-[10px] font-bold tracking-[0.12em] uppercase mb-2.5 text-slate-500"
                      >
                        Quick Actions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {QUICK_ACTIONS.map((action) => (
                          <button
                            key={action}
                            onClick={() => openFromQuickAction(action)}
                            className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-all"
                            style={{
                              color: '#5b21b6', // Dark purple text for contrast
                              background: 'rgba(124,58,237,0.12)',
                              border: '1px solid rgba(124,58,237,0.28)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(124,58,237,0.24)';
                              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.55)';
                              e.currentTarget.style.color = '#4c1d95';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(124,58,237,0.12)';
                              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.28)';
                              e.currentTarget.style.color = '#5b21b6';
                            }}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category cards */}
                    <div className="space-y-2">
                      {FAQ_DATA.map((cat, i) => {
                        const accent = CAT_ACCENT[cat.id] ?? CAT_ACCENT['getting-started'];
                        return (
                          <motion.button
                            key={cat.id}
                            onClick={() => openCategory(cat)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.055, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full p-3 rounded-2xl text-left transition-all"
                            style={{
                              background: 'rgba(255,255,255,0.4)',
                              border: '1px solid rgba(255,255,255,0.6)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.65)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.04)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {/* Colored icon square */}
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 text-white"
                                style={{
                                  background: accent.bg,
                                  boxShadow: `0 4px 14px ${accent.glow}`,
                                }}
                              >
                                {cat.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{cat.title}</p>
                                <p className="text-[11px] truncate mt-0.5 text-slate-500">
                                  {cat.description}
                                </p>
                              </div>
                              <svg
                                className="w-4 h-4 shrink-0 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CATEGORY VIEW */}
                {view === 'category' && activeCategory && (
                  <div className="space-y-2.5">
                    <BackButton onClick={handleBack} />

                    {(() => {
                      const accent = CAT_ACCENT[activeCategory.id] ?? CAT_ACCENT['getting-started'];
                      return (
                        <div
                          className="rounded-xl p-3 flex items-center gap-3"
                          style={{
                            background: 'rgba(255,255,255,0.4)',
                            border: '1px solid rgba(255,255,255,0.6)',
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 text-white"
                            style={{ background: accent.bg, boxShadow: `0 4px 12px ${accent.glow}` }}
                          >
                            {activeCategory.icon}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{activeCategory.title}</p>
                            <p className="text-[11px] mt-0.5 text-slate-500">
                              {activeCategory.description}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {activeCategory.questions.map((qa, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05, ease: 'easeOut' }}
                        onClick={() => startAnswerFlow(qa)}
                        className="w-full p-3.5 rounded-xl text-left text-sm transition-all text-slate-700"
                        style={{
                          background: 'rgba(255,255,255,0.4)',
                          border: '1px solid rgba(255,255,255,0.6)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
                          e.currentTarget.style.borderColor = 'rgba(139,92,246,0.32)';
                          e.currentTarget.style.color = '#1e293b'; // slate-900
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                          e.currentTarget.style.color = '#334155'; // slate-700
                        }}
                      >
                        {qa.q}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* SEARCH VIEW */}
                {view === 'search' && (
                  <div className="space-y-2.5">
                    <BackButton onClick={handleBack} />

                    {!query ? (
                      <div
                        className="rounded-xl p-3.5 text-sm text-slate-500"
                        style={{
                          background: 'rgba(255,255,255,0.4)',
                          border: '1px solid rgba(255,255,255,0.6)',
                        }}
                      >
                        Start typing to search FAQs…
                      </div>
                    ) : filteredResults.length === 0 ? (
                      <div
                        className="rounded-xl p-4"
                        style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)' }}
                      >
                        <p className="text-sm text-slate-600">No matches. Try:</p>
                        <div className="flex gap-2 mt-2.5 flex-wrap">
                          {['upscale', 'background', 'privacy'].map((s) => (
                            <button
                              key={s}
                              onClick={() => setQuery(s)}
                              className="text-xs px-2.5 py-1 rounded-full transition-all text-purple-800"
                              style={{
                                background: 'rgba(124,58,237,0.13)',
                                border: '1px solid rgba(124,58,237,0.3)',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(124,58,237,0.24)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(124,58,237,0.13)')}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      filteredResults.map((item, idx) => (
                        <motion.button
                          key={`${item.q}-${idx}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          onClick={() => startAnswerFlow(item)}
                          className="w-full p-3.5 rounded-xl text-left transition-all"
                          style={{
                            background: 'rgba(255,255,255,0.4)',
                            border: '1px solid rgba(255,255,255,0.6)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
                            e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                          }}
                        >
                          <p className="text-[11px] mb-1 text-slate-500">
                            {item.icon} {item.category}
                          </p>
                          <p className="text-sm font-medium text-slate-800">{item.q}</p>
                        </motion.button>
                      ))
                    )}
                  </div>
                )}

                {/* ANSWER VIEW */}
                {view === 'answer' && activeQuestion && (
                  <div className="space-y-3 pt-1">
                    <BackButton onClick={handleBack} />

                    {/* User bubble */}
                    <div className="flex justify-end">
                      <div
                        className="max-w-[84%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white font-medium leading-relaxed"
                        style={{
                          background: 'linear-gradient(135deg, #6d28d9, #a21caf)',
                          boxShadow: '0 6px 16px rgba(109,40,217,0.2)',
                        }}
                      >
                        {activeQuestion.q}
                      </div>
                    </div>

                    {/* Bot bubble */}
                    <div className="flex items-start gap-2.5">
                      <div className="relative shrink-0 mt-0.5">
                        <div
                          className="absolute -inset-0.5 rounded-full opacity-60"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #d946ef)' }}
                        />
                        <img
                          src={img.chatbotIcon}
                          alt="Assistant"
                          className="relative w-7 h-7 rounded-full object-cover z-10"
                        />
                      </div>

                      <AnimatePresence mode="wait">
                        {isTyping ? (
                          <motion.div
                            key="typing"
                            initial={{ opacity: 0, scale: 0.92, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: -4 }}
                            transition={{ duration: 0.18 }}
                            className="rounded-2xl rounded-tl-sm px-4 py-3"
                            style={{
                              background: 'rgba(255,255,255,0.6)',
                              border: '1px solid rgba(255,255,255,0.8)',
                            }}
                          >
                            <TypingDots />
                          </motion.div>
                        ) : showAnswer ? (
                          <motion.div
                            key="answer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="max-w-[88%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-slate-700"
                            style={{
                              background: 'rgba(255,255,255,0.6)',
                              border: '1px solid rgba(255,255,255,0.8)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                            }}
                          >
                            {activeQuestion.a}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>

              {/* ── FOOTER ───────────────────────────────────── */}
              <div
                className="shrink-0 h-11 px-4 flex items-center justify-between"
              >
                <span className="text-[11px] text-slate-500 font-medium">
                  Powered by PixelForge AI
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FAB ──────────────────────────────────────────── */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="relative w-14 h-14 rounded-full overflow-hidden transition-all"
            style={{
              boxShadow: isOpen
                ? '0 8px 28px rgba(12,11,24,0.55)'
                : '0 8px 32px rgba(124,58,237,0.55), 0 0 0 2px rgba(124,58,237,0.45)',
            }}
            aria-label={isOpen ? 'Close chatbot' : 'Open chatbot'}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: '#0c0b18', border: '2px solid rgba(255,255,255,0.08)' }}
                >
                  <svg className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.65)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.div>
              ) : (
                <motion.img
                  key="avatar"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.18 }}
                  src={img.chatbotIcon}
                  alt="Open chatbot"
                  className="w-full h-full object-cover"
                />
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </>
  );
}