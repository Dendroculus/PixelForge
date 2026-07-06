/**
 * Header copy configuration for route-aware page headers.
 *
 * Maps frontend routes to the title, subtitle, and presentation metadata rendered
 * by the global header.
 */

export const headerConfig = {
  // AI Features
  '/': {
    words: ['transform.', 'enhance.', 'edit.', 'optimize.'],
    subtitle:
      'All-in-one image studio for AI enhancements and everyday editing tools. Fast, simple, and built for creators.',
  },
  '/upscale': {
    words: ['upscale.', 'enhance.', 'enlarge.'],
    subtitle:
      'Increase image resolution with AI while preserving sharp details and clarity.',
  },
  '/remove-bg': {
    words: ['remove.', 'isolate.', 'transparent.'],
    subtitle:
      'Automatically remove image backgrounds in seconds for clean, professional cutouts.',
  },
  '/color-restoration': {
    words: ['restore.', 'revive.', 'colorize.'],
    subtitle:
      'Restore faded photos and bring old memories back to life with rich, natural color.',
  },
  '/object-remove': {
    words: ['remove.', 'erase.', 'clean.'],
    subtitle:
      'Paint over unwanted objects and let AI seamlessly remove them from your images.',
  },
  // Smart edit / utility features
  '/image-editor': {
    words: ['edit.', 'adjust.', 'perfect.'],
    subtitle:
      'Fine-tune brightness, contrast, and more with an easy editor designed for quick results.',
  },
  '/resize-image': {
    words: ['resize.', 'scale.', 'fit.'],
    subtitle:
      'Resize images to exact dimensions for web, social media, print, or any custom layout.',
  },
  '/crop-image': {
    words: ['crop.', 'frame.', 'focus.'],
    subtitle:
      'Crop and reframe images to highlight what matters most with pixel-precise control.',
  },
  '/rotate-flip': {
    words: ['rotate.', 'flip.', 'align.'],
    subtitle:
      'Rotate and flip images instantly to correct orientation and composition.',
  },
  '/watermark-adder': {
    words: ['watermark.', 'brand.', 'protect.'],
    subtitle:
      'Add text or logo watermarks to protect your work and keep your brand visible.',
  },
  '/compress-image': {
    words: ['compress.', 'reduce.', 'optimize.'],
    subtitle:
      'Reduce file size while maintaining quality for faster loading and easier sharing.',
  },
  '/convert-format': {
    words: ['convert.', 'switch.', 'export.'],
    subtitle: 'Convert images between popular formats quickly and reliably.',
  },
  '/metadata': {
    words: ['clean.', 'sanitize.', 'strip.'],
    subtitle:
      'Remove EXIF and hidden metadata from images to improve privacy before sharing.',
  },
  '/color-palette': {
    words: ['extract.', 'match.', 'create.'],
    subtitle:
      'Generate and explore color palettes from images for design, branding, and inspiration.',
  },
  // Special pages
  '/coming-soon': {
    titlePrefix: 'This page is still being forged.',
    words: ['coming soon.', 'in progress.', 'stay tuned.'],
    subtitle:
      'New tools are on the way. We’re building more features to expand your image workflow.',
  },
  '*': {
    titlePrefix: "Oops, this page doesn't exist.",
    words: ['not found.', 'wrong turn.', 'go home.'],
    subtitle:
      'The page you’re looking for isn’t available. Return to the homepage and keep exploring.',
  },
};
