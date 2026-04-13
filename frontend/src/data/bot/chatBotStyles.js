export const WIDGET_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .fw { font-family: 'DM Sans', sans-serif; }
  .fw-display { font-family: 'Syne', sans-serif; }

  .fw-scroll::-webkit-scrollbar { width: 3px; }
  .fw-scroll::-webkit-scrollbar-track { background: transparent; }
  .fw-scroll::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.35); border-radius: 99px; }
  .fw-scroll:hover::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.6); }

  @keyframes fw-dot-pop {
    0%, 100% { transform: translateY(0px); opacity: 0.6; }
    50% { transform: translateY(-5px); opacity: 1; }
  }

  .fw-dot { animation: fw-dot-pop 0.85s ease-in-out infinite; }
  .fw-dot:nth-child(2) { animation-delay: 0.17s; }
  .fw-dot:nth-child(3) { animation-delay: 0.34s; }

  @keyframes fw-online-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .fw-online { animation: fw-online-blink 2.4s ease-in-out infinite; }
`;