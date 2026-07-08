/**
 * User-facing file validation error messages.
 *
 * This module intentionally keeps validation copy separate from validation
 * logic. Validators return these stable messages so upload UI components can
 * stay simple and consistent across all image tools.
 */

export const ERROR_MESSAGES = Object.freeze({
  ATTACK: "Are you trying to attack the web? Well that's unfortunate",
  SPOOFED:
    'Nice try! That file is disguised as an image, are you trying to trick us?',
  SVG: 'SVGs are math! They already have infinite resolution',
  OTHER_IMAGE:
    'Nice picture, but we only support static PNG, JPG, and WEBP right now 🎨',
  VIDEO: 'Why do you even try to upload a video to an image upscaler web?',
  TIMEOUT: 'The file took too long to process. Is it corrupted? ⏳',
  DEFAULT: 'Uh oh! This file is not supported.',
  COLORIZED:
    'This image already has color! Please upload a black and white image.',
});

/**
 * Build a standard invalid validation result.
 *
 * @param {string} error - User-facing validation error message.
 * @returns {{isValid: false, error: string}} Standard invalid result.
 */
export const invalidResult = (error = ERROR_MESSAGES.DEFAULT) => ({
  isValid: false,
  error,
});
