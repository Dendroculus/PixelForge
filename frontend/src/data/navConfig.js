/**
 * Navigation configuration mapping for the main Navbar.
 * Groups tools into logical categories with their respective icons and routing.
 */
export const NavLinks = {
  enhance: {
    title: "AI Enhance",
    items: [
      { id: 'upscale', to: "/upscale", label: "Upscale Image", isAi: true, icon: "M13 10V3L4 14h7v7l9-11h-7z", desc: "Increase resolution by 4x without losing quality." },
      { id: 'remove-bg', to: "/remove-bg", label: "Remove Background", isAi: true, icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", desc: "Extract subjects instantly with high precision." },
      { id: 'denoise', to: "/coming-soon", label: "Denoise Image", isAi: true, icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4", desc: "Remove grain and artifacting from low-light photos." },
    ]
  },
  edit: {
    title: "Smart Edit",
    items: [
      { id: 'editor', to: "/coming-soon", label: "Image Editor", isAi: false, icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4", desc: "Adjust lighting, contrast, blur, and sharpen." }, // Combined Tool
      { id: 'resize', to: "/coming-soon", label: "Resize Image", isAi: false, icon: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4", desc: "Scale dimensions by pixels or percentage." },
      { id: 'crop', to: "/coming-soon", label: "Crop Image", isAi: false, icon: "M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5", desc: "Trim edges or cut out specific ratios." },
      { id: 'rotate', to: "/coming-soon", label: "Rotate & Flip", isAi: false, icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", desc: "Change orientation and mirror images." },
    ]
  },
  optimize: {
    title: "Optimize",
    items: [
      { id: 'compress', to: "/compress-image", label: "Compress Image", isAi: false, icon: "M19 14l-7 7m0 0l-7-7m7 7V3", desc: "Reduce file sizes while maintaining quality." },
      { id: 'convert', to: "/convert-format", label: "Convert Format", isAi: false, icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4", desc: "Easily switch between PNG, JPG, and WEBP." },
      { id: 'metadata', to: "/metadata", label: "Remove Metadata", isAi: false, icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", desc: "Strip EXIF data to protect your privacy." },
    ]
  },
  tools: {
    title: "Utilities",
    items: [
      { id: 'palette', to: "/color-palette", label: "Color Palette", isAi: false, icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01", desc: "Extract dominant hex codes from any photo." },
      { id: 'thumbnails', to: "/coming-soon", label: "Thumbnails Maker", isAi: false, icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z", desc: "Auto-generate sizes for social media." },
      { id: 'watermark', to: "/coming-soon", label: "Add Watermark", isAi: false, icon: "M12 21a5.001 5.001 0 01-5-5c0-2.5 3-6.5 5-9 2 2.5 5 6.5 5 9a5.001 5.001 0 01-5 5z M12 11v4m-2-2h4", desc: "Stamp logos or text to protect your work." },
    ]
  }
};