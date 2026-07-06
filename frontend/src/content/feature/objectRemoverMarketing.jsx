/**
 * Marketing copy for the Object Remover feature page.
 *
 * Defines the feature highlights and step-by-step instructions shown beside the
 * AI workspace.
 */

export const marketingProps = {
  subtitle:
    'Remove unwanted objects from photos with intelligent AI inpainting.',
  features: [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
          />
        </svg>
      ),
      title: 'Smart Object Detection',
      desc: 'AI-powered inpainting removes selected objects while rebuilding the surrounding background naturally.',
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      title: 'Secure & Private',
      desc: 'Your images are processed securely and removed by automated retention cleanup. No data is sold or shared.',
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: 'Fast & Automated',
      desc: 'Mark the object you want gone, and our cloud AI fills the area with realistic background detail.',
    },
  ],
  steps: [
    {
      step: '01',
      title: 'Upload',
      desc: 'Drag & drop or click to upload the photo you want to clean up.',
    },
    {
      step: '02',
      title: 'Mark Object',
      desc: 'Brush or select the unwanted object, person, text, or distraction you want removed.',
    },
    {
      step: '03',
      title: 'Download',
      desc: 'Download your cleaned image with the object removed and background restored.',
    },
  ],
};
