/**
 * Marketing copy for the Image Upscaler feature page.
 *
 * Defines the feature highlights and step-by-step instructions shown beside the
 * AI workspace.
 */

export const marketingProps = {
    subtitle: 'Advanced AI upscaling optimized for photos and digital art.',
    features: [
      {
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
        title: 'Lightning Fast', desc: 'GPU-accelerated processing delivers 4x upscaled images in seconds, not minutes.'
      },
      {
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
        title: 'Secure & Private', desc: 'Your images are processed securely and removed by automated retention cleanup. No data is sold or shared.'
      },
      {
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
        title: 'Optimized AI Model', desc: 'A single tuned Real-ESRGAN pipeline delivers consistent quality without setup complexity.'
      }
    ],
    steps: [
      { step: '01', title: 'Upload', desc: 'Drag & drop or click to upload any PNG, JPG, or WEBP image.' },
      { step: '02', title: 'Enhance', desc: 'Our Real-ESRGAN model upscales your image to 4x resolution with AI.' },
      { step: '03', title: 'Download', desc: 'Compare the before & after, then download your enhanced image instantly.' },
    ]
  };
