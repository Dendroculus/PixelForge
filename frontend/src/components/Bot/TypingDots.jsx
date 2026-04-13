/**
 * Renders animated typing indicator bubbles.
 */
export default function TypingDots() {
  return (
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
}