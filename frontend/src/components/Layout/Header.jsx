import { useState, useEffect } from 'react';
import { IMAGES as img } from '../../config';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * Renders the main application header with a rotating text animation.
 * @param {Object} props - The component props.
 * @param {string} [props.badgeText="The Open-Source Image Studio"] - Text to display in the top badge.
 * @param {string} [props.titlePrefix="What would you like to"] - The static part of the main heading.
 * @param {Array<string>} [props.words=["transform.", "enhance.", "edit.", "optimize."]] - Array of words to animate through.
 * @param {string} [props.subtitle=""] - Optional subtitle text displayed below the main heading.
 * @returns {JSX.Element}
 */
export default function Header({
  badgeText = "The Open-Source Image Studio",
  titlePrefix = "What would you like to",
  words = ["transform.", "enhance.", "edit.", "optimize."],
  subtitle = ""
}) {
  const [index, setIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!words || words.length <= 1) return;

    let fadeTimeout;

    const advanceWord = () => {
      setIndex(getNextIndex);
      setIsFading(false);
    };

    const getNextIndex = (prev) => (prev + 1) % words.length;

    const startFadeCycle = () => {
      setIsFading(true);
      fadeTimeout = setTimeout(advanceWord, 300);
    };

    const interval = setInterval(startFadeCycle, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimeout);
    };
  }, [words]);

  const displayWord = words && words.length > 0 ? words[index] : '';

  return (
    <header className="w-full flex flex-col items-center pt-2 px-4 mb-6">
      <Link to="/" className="group mb-5 relative">
        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-700"></div>
        <img
          src={img.darkLogo}
          alt="Pixel Forge"
          className="relative h-10 sm:h-12 w-auto object-contain transform transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105"
        />
      </Link>

      {badgeText && (
        <div className="flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-white/40 border border-white/60 shadow-sm backdrop-blur-md hover:bg-white/50 transition-colors cursor-default">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
          <span className="text-sm font-bold text-slate-700 tracking-wide">{badgeText}</span>
        </div>
      )}

      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tighter text-center leading-[1.1] mb-4">
        {titlePrefix} <br />
        <span
          className={`inline-block pb-2 text-transparent bg-clip-text bg-linear-to-r from-indigo-500 via-purple-500 to-fuchsia-500 transition-all duration-300 ease-in-out ${
            isFading ? 'opacity-0 translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-0'
          }`}
        >
          {displayWord}
        </span>
      </h1>

      {subtitle && (
        <p className="text-base sm:text-lg text-slate-600 font-medium text-center max-w-xl mb-0">
          {subtitle}
        </p>
      )}
    </header>
  );
}

Header.propTypes = {
  badgeText: PropTypes.string,
  titlePrefix: PropTypes.string,
  words: PropTypes.arrayOf(PropTypes.string),
  subtitle: PropTypes.string
};