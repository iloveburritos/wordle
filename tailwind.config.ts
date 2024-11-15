/** @type {import('tailwindcss').Config} */

module.exports = {
	content: [
	  './pages/**/*.{js,ts,jsx,tsx,mdx}',
	  './components/**/*.{js,ts,jsx,tsx,mdx}',
	  './app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
	  extend: {
		fontFamily: {
		  inter: ['Inter', 'sans-serif'],
		  exo: ['Exo', 'sans-serif'],
		  'vt323': ['VT323', 'monospace'],
		  'space-mono': ['Space Mono', 'monospace'],
		},
		backgroundColor: {
		  'header-bg': 'var(--header-bg)',
		  'footer-bg': 'var(--footer-bg)',
		},
		textColor: {
		  'header-text': 'var(--header-text)',
		  'footer-text': 'var(--footer-text)',
		},
	  },
	},
	plugins: [],
  }