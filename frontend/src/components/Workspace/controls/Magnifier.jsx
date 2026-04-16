import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * A reusable button to toggle zoom state.
 * @param {Object} props - The component props.
 * @param {boolean} props.isZoomed - Whether the active mode is zoomed in.
 * @param {Function} props.onToggle - Callback fired when the button is clicked.
 * @param {string} [props.className] - Custom Tailwind CSS classes.
 * @param {string} [props.title] - Optional tooltip override.
 * @returns {JSX.Element}
 */
export function ZoomButton({ isZoomed, onToggle, className = "", title }) {
  const defaultTitle = isZoomed ? 'Zoom out' : 'Zoom in';
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle(e);
      }}
      className={className}
      title={title || defaultTitle}
    >
      {isZoomed ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      )}
    </button>
  );
}

ZoomButton.propTypes = {
  isZoomed: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  className: PropTypes.string,
  title: PropTypes.string,
};

/**
 * Reusable wrapper component providing a magnifying glass zoom effect with absolute positioning capabilities.
 * @param {Object} props - The component props.
 * @param {Function|React.ReactNode} props.children - Render prop exposing zoom state, or static node.
 * @param {number} [props.zoomScale=2.5] - The scale multiplier when zoomed.
 * @param {string} [props.containerClassName] - Classes for the outer mouse-tracking bounding box.
 * @param {string} [props.innerClassName] - Classes for the transforming inner container.
 * @param {Function} [props.renderControls] - Render prop for overlay controls (e.g., zoom button).
 * @returns {JSX.Element}
 */
export default function Magnifier({
  children,
  zoomScale = 2.5,
  containerClassName = 'relative w-full h-full overflow-hidden',
  innerClassName = 'w-full h-full',
  renderControls
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const toggleZoom = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsZoomed((prev) => {
      if (prev) setMousePos({ x: 50, y: 50 });
      return !prev;
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setMousePos({ x, y });
  }, [isZoomed]);

  const handleMouseLeave = useCallback(() => {
    if (isZoomed) setMousePos({ x: 50, y: 50 });
  }, [isZoomed]);

  return (
    <div
      role="presentation"
      className={`${containerClassName} ${isZoomed ? 'cursor-crosshair' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`transition-transform duration-75 ease-out ${innerClassName}`}
        style={{
          transform: isZoomed ? `scale(${zoomScale})` : 'scale(1)',
          transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
        }}
      >
        {typeof children === 'function' ? children({ isZoomed }) : children}
      </div>

      {renderControls && renderControls({ isZoomed, toggleZoom })}
    </div>
  );
}

Magnifier.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  zoomScale: PropTypes.number,
  containerClassName: PropTypes.string,
  innerClassName: PropTypes.string,
  renderControls: PropTypes.func,
};