import { useState, useRef } from 'react';
import { apiService } from '../../services/apiService';
import { Turnstile } from '@marsidev/react-turnstile';

/**
 * Renders the feedback form with Turnstile verification.
 */
export default function FeedbackForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  const turnstileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!turnstileToken) {
      setErrorMsg('Please complete the security verification.');
      return;
    }

    setStatus('loading');
    try {
      await apiService.submitFeedback(
        formData.name, 
        formData.email, 
        formData.message, 
        turnstileToken
      );
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message === 'LIMIT_REACHED' ? 'You have reached your daily feedback limit.' : err.message);
      if (turnstileRef.current) turnstileRef.current.reset();
      setTurnstileToken('');
    }
  };

  if (status === 'success') {
    return (
      <div className="p-5 bg-white/60 border border-white/80 rounded-2xl shadow-sm text-center animate-fade-in">
        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-slate-800 text-base mb-1">Message Sent!</p>
        <p className="text-sm text-slate-600">Thank you for your feedback. Our team will review it shortly.</p>
      </div>
    );
  }

  const inputStyles = "w-full bg-white/50 border border-white/60 focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 rounded-xl px-4 py-2.5 outline-none transition-all duration-200 text-slate-700 placeholder-slate-400";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-sm animate-fade-in">
      <input 
        type="text" 
        placeholder="Your Name" 
        value={formData.name} 
        onChange={(e) => setFormData({...formData, name: e.target.value})} 
        required 
        className={inputStyles}
      />
      
      <input 
        type="email" 
        placeholder="Your Email Address" 
        value={formData.email} 
        onChange={(e) => setFormData({...formData, email: e.target.value})} 
        required 
        className={inputStyles}
      />
      
      <textarea 
        placeholder="How can we help you or improve?" 
        value={formData.message} 
        onChange={(e) => setFormData({...formData, message: e.target.value})} 
        required 
        rows={4}
        className={`${inputStyles} resize-none`}
      />

      <div className="flex justify-center my-1">
        <Turnstile 
          ref={turnstileRef}
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
          onSuccess={setTurnstileToken} 
          options={{ size: 'compact' }}
        />
      </div>

      {errorMsg && (
        <div className="bg-red-50/80 border border-red-100 text-red-600 px-3 py-2 rounded-lg text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      <button 
        type="submit" 
        disabled={status === 'loading'} 
        className="w-full mt-1 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
      >
        {status === 'loading' ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </>
        ) : (
          'Send Feedback'
        )}
      </button>
    </form>
  );
}