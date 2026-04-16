import PropTypes from 'prop-types';

/**
 * Renders the application footer containing copyright and legal links.
 * @param {Object} props - The component props.
 * @param {Function} props.openModal - Handler to open specific legal documents in the modal.
 * @returns {JSX.Element}
 */
export default function Footer({ openModal }) {
  return (
    <footer className="w-full border-t border-white/30 bg-white/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col items-center justify-center gap-4 text-sm text-slate-600">
        <p className="text-center">© 2026 Pixel Forge. AI Powered by Replicate.</p>

        <div className="flex items-center gap-6 group font-medium">
          <button type="button" onClick={() => openModal('privacy')} className="transition-colors focus:outline-none group-hover:text-slate-400 hover:text-slate-900">Privacy</button>
          <button type="button" onClick={() => openModal('terms')} className="transition-colors focus:outline-none group-hover:text-slate-400 hover:text-slate-900">Terms</button>
          <button type="button" onClick={() => openModal('security')} className="transition-colors focus:outline-none group-hover:text-slate-400 hover:text-slate-900">Security</button>
        </div>
      </div>
    </footer>
  );
}

Footer.propTypes = {
  openModal: PropTypes.func.isRequired,
};