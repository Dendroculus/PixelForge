import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IMAGES as img } from '../../config';
import { FAQ_DATA, QUICK_ACTIONS, CAT_ACCENT } from '../../data/bot/chatBotdata';
import { WIDGET_STYLES } from '../../data/bot/chatBotStyles';
import { useFaqChatBot } from '../../hooks/bot/useFaqChatBot';
import ChatbotHeader from '../../components/Bot/ChatbotHeader';
import HomeView from '../../components/Bot/HomeView';
import CategoryView from '../../components/Bot/CategoryView';
import SearchView from '../../components/Bot/SearchView';
import AnswerView from '../../components/Bot/AnswerView';
import FabToggle from '../../components/Bot/FabToggle';

/**
 * Renders FAQ chatbot container and routes chatbot views.
 */
export default function FaqChatbotWidget() {
  const {
    isOpen,
    setIsOpen,
    view,
    setView,
    activeCategory,
    activeQuestion,
    query,
    setQuery,
    isTyping,
    showAnswer,
    searchFocused,
    setSearchFocused,
    filteredResults,
    startAnswerFlow,
    openCategory,
    openFromQuickAction,
    handleBack,
    handleClose,
  } = useFaqChatBot();

  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [view, isTyping, showAnswer]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WIDGET_STYLES }} />
      <div
      className="fixed right-4 sm:right-5 flex flex-col items-end z-999 fw text-slate-800"
      style={{
        bottom: 'calc(var(--footer-safe-offset, 16px) + env(safe-area-inset-bottom))',
      }}
    >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mb-3 w-95 max-w-[calc(100vw-24px)] h-[78vh] max-h-170 min-h-130 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
              style={{ background: 'linear-gradient(to bottom right, #EEAECA, #94BBE9)', border: '1px solid rgba(255,255,255,0.6)' }}
            >
              <ChatbotHeader
                img={img}
                query={query}
                setQuery={setQuery}
                setView={setView}
                searchFocused={searchFocused}
                setSearchFocused={setSearchFocused}
                handleClose={handleClose}
              />

              <div ref={bodyRef} className="flex-1 overflow-y-auto fw-scroll px-3 py-3">
                {view === 'home' && (
                  <HomeView
                    FAQ_DATA={FAQ_DATA}
                    QUICK_ACTIONS={QUICK_ACTIONS}
                    CAT_ACCENT={CAT_ACCENT}
                    openFromQuickAction={openFromQuickAction}
                    openCategory={openCategory}
                  />
                )}
                {view === 'category' && activeCategory && (
                  <CategoryView
                    activeCategory={activeCategory}
                    CAT_ACCENT={CAT_ACCENT}
                    handleBack={handleBack}
                    startAnswerFlow={startAnswerFlow}
                  />
                )}
                {view === 'search' && (
                  <SearchView
                    query={query}
                    setQuery={setQuery}
                    filteredResults={filteredResults}
                    handleBack={handleBack}
                    startAnswerFlow={startAnswerFlow}
                  />
                )}
                {view === 'answer' && activeQuestion && (
                  <AnswerView
                    img={img}
                    activeQuestion={activeQuestion}
                    isTyping={isTyping}
                    showAnswer={showAnswer}
                    handleBack={handleBack}
                  />
                )}
              </div>

              <div className="shrink-0 h-11 px-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Powered by PixelForge AI</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <FabToggle isOpen={isOpen} setIsOpen={setIsOpen} img={img} />
      </div>
    </>
  );
}