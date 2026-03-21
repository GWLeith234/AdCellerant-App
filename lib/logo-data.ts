/**
 * AdCellerant flame icon as an inline SVG data URI.
 * This eliminates all dependencies on PNG files in public/logos/
 * and avoids vision-processing errors from the Anthropic API.
 */
export const ADCELLERANT_ICON_BASE64 = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="flame" x1="32" y1="58" x2="32" y2="4" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF4A2D"/>
      <stop offset="50%" stop-color="#FF6B3D"/>
      <stop offset="100%" stop-color="#FFA44F"/>
    </linearGradient>
  </defs>
  <path d="M32 4C32 4 18 20 18 36c0 7.7 6.3 14 14 14s14-6.3 14-14C46 20 32 4 32 4z
           M32 46c-5.5 0-10-4.5-10-10 0-8.2 6.2-18.5 10-24 3.8 5.5 10 15.8 10 24 0 5.5-4.5 10-10 10z"
        fill="url(#flame)"/>
  <path d="M32 18c0 0-6 8-6 16c0 3.3 2.7 6 6 6s6-2.7 6-6c0-8-6-16-6-16z"
        fill="url(#flame)" opacity="0.6"/>
</svg>`)}`;
