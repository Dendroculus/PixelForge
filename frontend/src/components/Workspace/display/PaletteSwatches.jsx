import { motion } from 'framer-motion';

/**
 * Calculates YIQ contrast to determine text visibility over backgrounds.
 * @param {string} hexcolor - Background hex code.
 * @returns {string} Tailwind text color class.
 */
function getContrastYIQ(hexcolor) {
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 2), 16);
  const b = parseInt(hex.slice(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? 'text-slate-900' : 'text-white';
}

/**
 * Renders palette swatches with smooth morphing color interpolation.
 * @param {{
 * palette: { id: string | number, hex: string }[],
 * paletteStyle: 'square' | 'circle',
 * copiedHex: string | null,
 * onCopy: (hex: string) => void
 * }} props
 * @returns {JSX.Element}
 */
export default function PaletteSwatches({
  palette,
  paletteStyle,
  copiedHex,
  onCopy,
}) {
  if (paletteStyle === 'square') {
    return (
      <div className="flex h-14 w-full overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
        {palette.map((item, i) => (
          <motion.button
            key={`palette-block-${item.id}`}
            initial={{ opacity: 0, backgroundColor: "#ffffff" }}
            animate={{ opacity: 1, backgroundColor: item.hex }}
            transition={{
              opacity: { duration: 0.4, delay: i * 0.05, ease: "easeOut" },
              backgroundColor: { duration: 0.15, ease: "linear" }
            }}
            onClick={() => onCopy(item.hex)}
            className="group relative flex-1 transition-all duration-300 ease-in-out hover:flex-[1.5] focus:outline-none"
            title={`Copy ${item.hex.toUpperCase()}`}
          >
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
              {copiedHex === item.hex ? (
                <svg className={`h-5 w-5 ${getContrastYIQ(item.hex)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className={`hidden whitespace-nowrap text-[10px] font-black tracking-wider sm:block ${getContrastYIQ(item.hex)}`}>
                  {item.hex.toUpperCase()}
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {palette.map((item, i) => (
        <motion.button
          key={`palette-circle-${item.id}`}
          initial={{ opacity: 0, backgroundColor: "#ffffff" }}
          animate={{ opacity: 1, backgroundColor: item.hex }}
          transition={{
            opacity: { duration: 0.4, delay: i * 0.04, ease: "easeOut" },
            backgroundColor: { duration: 0.15, ease: "linear" }
          }}
          onClick={() => onCopy(item.hex)}
          className="group relative h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-slate-200/70 shadow-sm transition-transform hover:scale-110 focus:outline-none"
          title={`Copy ${item.hex.toUpperCase()}`}
        >
          <span className="absolute inset-0 grid place-items-center">
            {copiedHex === item.hex ? (
              <svg className={`h-4 w-4 ${getContrastYIQ(item.hex)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className={`hidden text-[9px] font-black tracking-wider group-hover:block ${getContrastYIQ(item.hex)}`}>
                {item.hex.replace('#', '')}
              </span>
            )}
          </span>
        </motion.button>
      ))}
    </div>
  );
}