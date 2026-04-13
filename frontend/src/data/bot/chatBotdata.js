export const FAQ_DATA = [
  {
    id: 'getting-started',
    icon: '🚀',
    title: 'Getting Started',
    description: 'Quick setup and first-time usage',
    questions: [
      {
        q: 'What is PixelForge?',
        a: 'PixelForge is an AI-powered image enhancement platform with tools like image upscaling and background removal to help creators improve visuals quickly.'
      },
      {
        q: 'How do I use PixelForge for the first time?',
        a: 'Pick a tool from the home screen, upload your image, run processing, then download the result.'
      },
      {
        q: 'Do I need to create an account?',
        a: 'Core features are available with minimal onboarding while PixelForge is in active development.'
      }
    ]
  },
  {
    id: 'tools',
    icon: '🛠️',
    title: 'Tools & Features',
    description: 'How each tool works',
    questions: [
      {
        q: 'How do I upscale an image?',
        a: 'Open Upscale Image, upload your file, and process. PixelForge enhances resolution while preserving details.'
      },
      {
        q: 'How do I remove background?',
        a: 'Open Remove Background, upload your image, and AI isolates the subject automatically.'
      },
      {
        q: 'Which formats are supported?',
        a: 'JPG, PNG, and WEBP are supported.'
      },
      {
        q: 'What is the max upload size?',
        a: 'Current upload limit is 10MB per image.'
      }
    ]
  },
  {
    id: 'quality',
    icon: '✨',
    title: 'Image Quality',
    description: 'Best output tips',
    questions: [
      {
        q: 'Why is output still blurry?',
        a: 'Very low-resolution originals have limits. Use the cleanest source image possible and upscale first.'
      },
      {
        q: 'How can I get best results?',
        a: 'Use well-lit, less compressed images. Better input gives better AI output.'
      }
    ]
  },
  {
    id: 'privacy',
    icon: '🔐',
    title: 'Privacy & Safety',
    description: 'Data & trust',
    questions: [
      {
        q: 'Do you store my uploaded images?',
        a: 'PixelForge is privacy-focused: images are processed securely and are not used for external model training.'
      },
      {
        q: 'How long are files kept?',
        a: 'Files are removed after result delivery/session completion based on current backend flow.'
      }
    ]
  }
];

export const QUICK_ACTIONS = [
  'How do I upscale an image?',
  'How do I remove background?',
  'Which formats are supported?',
  'What is the max upload size?'
];

export const CAT_ACCENT = {
  'getting-started': {
    bg: 'linear-gradient(135deg, #7c3aed 0%, #d946ef 100%)',
    glow: 'rgba(124,58,237,0.55)',
    pill: 'rgba(124,58,237,0.15)',
    pillBorder: 'rgba(124,58,237,0.3)',
  },
  tools: {
    bg: 'linear-gradient(135deg, #0891b2 0%, #3b82f6 100%)',
    glow: 'rgba(8,145,178,0.55)',
    pill: 'rgba(8,145,178,0.15)',
    pillBorder: 'rgba(8,145,178,0.3)',
  },
  quality: {
    bg: 'linear-gradient(135deg, #d97706 0%, #f97316 100%)',
    glow: 'rgba(217,119,6,0.55)',
    pill: 'rgba(217,119,6,0.15)',
    pillBorder: 'rgba(217,119,6,0.3)',
  },
  privacy: {
    bg: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    glow: 'rgba(5,150,105,0.55)',
    pill: 'rgba(5,150,105,0.15)',
    pillBorder: 'rgba(5,150,105,0.3)',
  },
};