import { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { IMAGES as img } from '@/config';
import { NavLinks } from '@/data/navConfig';

/**
 * Standardized SVG Icon wrapper.
 * @param {Object} props - The component props.
 * @param {string} props.d - The SVG path data string.
 * @returns {JSX.Element}
 */
const Icon = ({ d }) => (
  <svg
    className="w-5.5 h-5.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d={d}
    />
  </svg>
);

Icon.propTypes = {
  d: PropTypes.string.isRequired,
};

/**
 * Desktop dropdown container.
 * @param {Object} props - The component props.
 * @param {string} props.title - The title of the dropdown menu.
 * @param {React.ReactNode} props.children - The dropdown items.
 * @returns {JSX.Element}
 */
const NavDropdown = ({ title, children }) => (
  <div className="relative group">
    <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors py-2">
      {title}
      <svg
        className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:rotate-180 transition-all duration-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
    <div className="absolute top-full left-0 hidden group-hover:block pt-3">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-2xl p-2 w-64 flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  </div>
);

NavDropdown.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

/**
 * Individual link item within desktop dropdowns.
 * Applies visual hierarchy based on AI usage requirements.
 * @param {Object} props - The component props.
 * @param {string} props.to - The route path to link to.
 * @param {React.ReactNode} props.icon - The icon element to display.
 * @param {React.ReactNode} props.children - The link label/content.
 * @param {boolean} [props.isAi=false] - Whether the link points to an AI-powered tool.
 * @returns {JSX.Element}
 */
const DropdownItem = ({ to, icon, children, isAi }) => {
  const baseHoverClass = isAi
    ? 'hover:bg-indigo-50/60 hover:border-indigo-100/50'
    : 'hover:bg-slate-50 hover:border-slate-200/50';

  const textHoverClass = isAi
    ? 'group-hover/item:text-indigo-800'
    : 'group-hover/item:text-slate-900';

  const iconHoverClass = isAi
    ? 'group-hover/item:text-indigo-500'
    : 'group-hover/item:text-slate-700';

  return (
    <Link
      to={to}
      className={`group/item px-3 py-2.5 text-sm text-slate-600 rounded-xl transition-all flex items-center justify-between border border-transparent ${baseHoverClass}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`text-slate-400 transition-colors shrink-0 ${iconHoverClass}`}
        >
          {icon}
        </div>
        <span className={`font-medium transition-colors ${textHoverClass}`}>
          {children}
        </span>
      </div>
      {isAi && (
        <span className="text-[9px] bg-linear-to-r from-indigo-500 to-purple-500 text-white px-1.5 py-0.5 rounded-md font-bold shadow-sm tracking-wider uppercase">
          AI
        </span>
      )}
    </Link>
  );
};

DropdownItem.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  isAi: PropTypes.bool,
};

/**
 * Main Navigation component wrapping global routing and responsive menus.
 * @returns {JSX.Element}
 */
export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full border-b border-white/40 bg-white/40 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            src={img.icon}
            alt="Pixel Forge Logo"
            className="h-8 sm:h-10 md:h-8 w-auto object-contain block"
          />
          <img
            src={img.textBlack}
            alt="Pixel Forge Text"
            className="h-6 sm:h-7 md:h-4 w-auto object-contain block translate-y-0.5"
          />
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          {Object.values(NavLinks).map((category) => (
            <NavDropdown key={category.title} title={category.title}>
              {category.items.map((item) => (
                <DropdownItem
                  key={item.id}
                  to={item.to}
                  isAi={item.isAi}
                  icon={<Icon d={item.icon} />}
                >
                  {item.label}
                </DropdownItem>
              ))}
            </NavDropdown>
          ))}

          <div className="w-px h-6 bg-slate-300/50 mx-2"></div>

          <a
            href="https://github.com/Dendroculus/image-upscaler-website"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:text-slate-900 transition-colors flex items-center gap-1.5 font-bold text-slate-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>

        <button
          className="lg:hidden p-2 text-slate-700 hover:bg-white/50 rounded-lg transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/40 bg-white/80 backdrop-blur-3xl px-6 py-6 space-y-6 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            {Object.values(NavLinks).map((category) => (
              <div key={category.title}>
                <div
                  className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-2 ${category.title !== 'Enhance' ? 'mt-4' : ''}`}
                >
                  {category.title}
                </div>
                {category.items.map((item) => {
                  const activeBg = item.isAi
                    ? 'active:bg-indigo-50'
                    : 'active:bg-slate-100';
                  return (
                    <Link
                      key={item.id}
                      to={item.to}
                      className={`py-2.5 px-2 rounded-lg ${activeBg} flex justify-between items-center transition-colors`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                      {item.isAi && (
                        <span className="text-[10px] bg-linear-to-r from-indigo-500 to-purple-500 text-white px-1.5 py-0.5 rounded font-bold">
                          AI
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
