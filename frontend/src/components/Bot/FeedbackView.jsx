import FeedbackForm from './FeedbackForm';
import PropTypes from 'prop-types';

/**
 * Renders the feedback view with a back button and form.
 * @param {Object} props - Component props.
 * @param {Function} props.handleBack - Function to navigate back to the home view.
 */
export default function FeedbackView({ handleBack }) {
  return (
    <div className="flex flex-col h-full animate-fade-in text-slate-800">
      <button 
        onClick={handleBack}
        className="flex items-center gap-1.5 text-blue-600 text-sm font-medium mb-4 hover:opacity-80 transition-opacity w-fit"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </button>

      <div className="mb-4">
        <h3 className="font-bold text-lg mb-1">Contact Support</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Have a bug to report or a feature request? Send us a message directly.
        </p>
      </div>

      <div className="bg-white/60 p-4 rounded-2xl border border-white/40 shadow-sm">
        <FeedbackForm />
      </div>
    </div>
  );
}


FeedbackView.propTypes = {  
    handleBack: PropTypes.func.isRequired,
};