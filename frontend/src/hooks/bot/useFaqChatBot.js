import { useEffect, useMemo, useRef, useState } from 'react';
import { FAQ_DATA } from '@/data/bot/chatBotdata';

/**
 * Manages state and interaction flow for the FAQ chatbot widget.
 * @returns {Object} Chatbot state and control functions.
 */
export function useFaqChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('home');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const typingTimerRef = useRef(null);

  const allQuestions = useMemo(
    () =>
      FAQ_DATA.flatMap((cat) =>
        cat.questions.map((qa) => ({
          ...qa,
          category: cat.title,
          icon: cat.icon,
          categoryId: cat.id,
        })),
      ),
    [],
  );

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allQuestions.filter(
      (item) =>
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [query, allQuestions]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  /**
   * Starts answer animation flow for the selected question.
   * @param {Object} qa - The question and answer object.
   */
  const startAnswerFlow = (qa) => {
    setActiveQuestion(qa);
    setView('answer');
    setIsTyping(true);
    setShowAnswer(false);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setShowAnswer(true);
    }, 1100);
  };

  /**
   * Opens a specific FAQ category view.
   * @param {Object} category - The selected category object.
   */
  const openCategory = (category) => {
    setActiveCategory(category);
    setView('category');
  };

  /**
   * Opens an answer flow directly from a quick action text match.
   * @param {string} text - The question string to match.
   */
  const openFromQuickAction = (text) => {
    const found = allQuestions.find(
      (q) => q.q.toLowerCase() === text.toLowerCase(),
    );
    if (found) {
      startAnswerFlow(found);
    }
  };

  /**
   * Handles back navigation across all chatbot views.
   */
  const handleBack = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    setIsTyping(false);
    setShowAnswer(false);

    if (view === 'answer') {
      if (query.trim()) {
        setView('search');
      } else if (activeCategory) {
        setView('category');
      } else {
        setView('home');
      }
      return;
    }

    if (view === 'category' || view === 'search' || view === 'feedback') {
      setView('home');
    }
  };

  /**
   * Closes chatbot and resets state safely.
   */
  const handleClose = () => {
    setIsOpen(false);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    setTimeout(() => {
      setView('home');
      setActiveCategory(null);
      setActiveQuestion(null);
      setQuery('');
      setIsTyping(false);
      setShowAnswer(false);
      setSearchFocused(false);
    }, 180);
  };

  return {
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
  };
}
