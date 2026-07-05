/**
 * Interactive before/after image comparison component.
 *
 * Used on landing and marketing sections to show the visible difference between
 * an original image and the processed PixelForge result.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Render a draggable before/after comparison slider.
 *
 * @returns {JSX.Element} Rendered UI.
 */
const BeforeAfterSlider = ({ beforeImage, afterImage, altText = "Before and after comparison" }) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = (event) => {
    setSliderPosition(event.target.value);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl shadow-2xl aspect-video bg-gray-100 select-none">
      {/* Base Image (After) */}
      <img
        src={afterImage}
        alt={`${altText} - After`}
        className="absolute inset-0 object-cover w-full h-full pointer-events-none"
        loading="lazy"
      />

      {/* Overlay Image (Before) with CSS Clip Path */}
      <img
        src={beforeImage}
        alt={`${altText} - Before`}
        className="absolute inset-0 object-cover w-full h-full pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        loading="lazy"
      />

      {/* Visual Slider Line & Handle */}
      <div
        className="absolute inset-y-0 w-1 bg-white pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
      >
        <div className="absolute top-1/2 left-1/2 flex items-center justify-center w-8 h-8 -mt-4 -ml-4 bg-white rounded-full shadow-lg text-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18-6-6 6-6"/>
            <path d="m15 18 6-6-6-6"/>
          </svg>
        </div>
      </div>

      {/* 
        Native Range Input (Invisible) 
        Acts as the interactive layer capturing all mouse/touch events automatically.
      */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={handleSliderChange}
        className="absolute inset-0 z-20 w-full h-full opacity-0 cursor-ew-resize"
        aria-label="Image comparison slider"
      />
    </div>
  );
};

BeforeAfterSlider.propTypes = {
  beforeImage: PropTypes.string.isRequired,
  afterImage: PropTypes.string.isRequired,
  altText: PropTypes.string
};

export default BeforeAfterSlider;