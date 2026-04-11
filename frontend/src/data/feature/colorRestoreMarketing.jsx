export const marketingProps = {
  subtitle: 'Bring black-and-white photos to life with modern AI color restoration.',
  features: [
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7h18M3 12h18M3 17h18" /></svg>,
      title: 'Natural Skin & Scene Tones',
      desc: 'DDColor predicts realistic color palettes instead of flat tint overlays for more lifelike results.'
    },
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
      title: 'Private by Design',
      desc: 'Uploads are processed securely, then cleaned up automatically from temporary storage.'
    },
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      title: 'Fast Cloud Inference',
      desc: 'Optimized cloud GPU pipeline restores colors in seconds with minimal manual setup.'
    }
  ],
  steps: [
    { step: '01', title: 'Upload', desc: 'Upload a grayscale or faded photo (PNG, JPG, or WEBP).' },
    { step: '02', title: 'Restore', desc: 'AI analyzes luminance and predicts realistic color composition.' },
    { step: '03', title: 'Download', desc: 'Preview the result and save your restored color image.' },
  ]
};