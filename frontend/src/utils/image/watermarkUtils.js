/**
 * Parses a string and character-style array into line arrays with grouped text segments.
 * Segments group consecutive characters that share the exact same styling.
 * * @param {string} chars 
 * @param {Array<{b: boolean, i: boolean, u: boolean}>} styles 
 * @param {{b: boolean, i: boolean, u: boolean}} defaultStyles 
 * @returns {Array<{text: string, segments: Array<{text: string, b: boolean, i: boolean, u: boolean}>}>}
 */
export function parseWatermarkTextLines(chars, styles, defaultStyles) {
  if (!chars) return [];
  
  const lines = [];
  let currentLineText = '';
  let currentLineStyles = [];

  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '\n') {
      lines.push({ text: currentLineText, styles: currentLineStyles });
      currentLineText = '';
      currentLineStyles = [];
    } else {
      currentLineText += chars[i];
      currentLineStyles.push(styles[i] || defaultStyles);
    }
  }
  lines.push({ text: currentLineText, styles: currentLineStyles });

  return lines.map((line) => {
    if (!line.text) return { text: '', segments: [] };

    const segments = [];
    let currentSegment = { text: line.text[0], ...line.styles[0] };

    for (let i = 1; i < line.text.length; i++) {
      const style = line.styles[i] || defaultStyles;
      if (
        style.b === currentSegment.b &&
        style.i === currentSegment.i &&
        style.u === currentSegment.u
      ) {
        currentSegment.text += line.text[i];
      } else {
        segments.push(currentSegment);
        currentSegment = { text: line.text[i], ...style };
      }
    }
    segments.push(currentSegment);

    return { text: line.text, segments };
  });
}

/**
 * Generates the standardized CSS style object for text watermark segments.
 * @param {{b: boolean, i: boolean, u: boolean}} seg
 * @returns {React.CSSProperties}
 */
export const getTextSegmentStyle = (seg) => ({
  fontWeight: seg.b ? 'bold' : 'normal',
  fontStyle: seg.i ? 'italic' : 'normal',
  textDecoration: seg.u ? 'underline' : 'none',
  textDecorationSkipInk: 'none', // Keeps underline continuous for characters like 'j' and 'f'
});