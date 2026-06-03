import { useState, useRef } from 'react';
import { apiService } from '../../apiService';
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

  /**
   * Handles the submission of the feedback form.
   * @param {React.FormEvent} e - Form submission event.
   */
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
      <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center">
        <p className="font-semibold mb-1">Message Sent!</p>
        <p>Thank you for your feedback. Our team will review it shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
      <input 
        type="text" 
        placeholder="Your Name" 
        value={formData.name} 
        onChange={(e) => setFormData({...formData, name: e.target.value})} 
        required 
        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
      />
      <input 
        type="email" 
        placeholder="Your Email" 
        value={formData.email} 
        onChange={(e) => setFormData({...formData, email: e.target.value})} 
        required 
        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
      />
      <textarea 
        placeholder="How can we help you?" 
        value={formData.message} 
        onChange={(e) => setFormData({...formData, message: e.target.value})} 
        required 
        rows={4}
        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
      />

      <div className="flex justify-center my-1">
        <Turnstile 
          ref={turnstileRef}
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
          onSuccess={setTurnstileToken} 
          options={{ size: 'compact' }}
        />
      </div>

      {errorMsg && <p className="text-red-500 text-xs text-center">{errorMsg}</p>}

      <button 
        type="submit" 
        disabled={status === 'loading'} 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-70"
      >
        {status === 'loading' ? 'Sending...' : 'Send Feedback'}
      </button>
    </form>
  );
}