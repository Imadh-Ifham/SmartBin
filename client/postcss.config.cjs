module.exports = {
  // Use the Tailwind PostCSS adapter package (not tailwindcss directly) and autoprefixer.
  // This ensures PostCSS resolves the correct integration package introduced in Tailwind v4+.
  plugins: [require('@tailwindcss/postcss'), require('autoprefixer')],
}
