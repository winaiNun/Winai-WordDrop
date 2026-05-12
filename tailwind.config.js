/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app.vue',
    './components/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mali: ['Mali', 'cursive'],
        itim: ['Itim', 'cursive'],
      },
      keyframes: {
        /* ── Game interactions ── */
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '15%': { transform: 'translateX(-10px)' },
          '30%': { transform: 'translateX(10px)' },
          '45%': { transform: 'translateX(-8px)' },
          '60%': { transform: 'translateX(8px)' },
          '75%': { transform: 'translateX(-4px)' },
          '90%': { transform: 'translateX(4px)' },
        },
        popIn: {
          '0%':  { transform: 'scale(0.1) rotate(-15deg)', opacity: '0' },
          '70%': { transform: 'scale(1.15) rotate(5deg)' },
          '100%':{ transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0.2)', opacity: '0' },
          '50%':  { transform: 'scale(1.2)' },
          '75%':  { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%,100%': { transform: 'rotate(-4deg) scale(1.05)' },
          '50%':     { transform: 'rotate(4deg)  scale(1.05)' },
        },
        /* ── Background ── */
        particleRise: {
          '0%':   { transform: 'translateY(0) rotate(0deg) scale(1)',     opacity: '0' },
          '8%':   { opacity: '1' },
          '90%':  { opacity: '0.8' },
          '100%': { transform: 'translateY(-110vh) rotate(720deg) scale(0.4)', opacity: '0' },
        },
        bgShift: {
          '0%,100%': { opacity: '0.4', transform: 'scale(1)   translate(0,0)' },
          '33%':     { opacity: '0.7', transform: 'scale(1.15) translate(3%,-3%)' },
          '66%':     { opacity: '0.5', transform: 'scale(0.95) translate(-2%,4%)' },
        },
        twinkle: {
          '0%,100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%':     { opacity: '1',   transform: 'scale(1.3)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        shake:        'shake 0.55s ease-in-out',
        popIn:        'popIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275) both',
        bounceIn:     'bounceIn 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both',
        wiggle:       'wiggle 0.45s ease-in-out 3',
        particleRise: 'particleRise var(--dur,14s) var(--delay,0s) ease-in-out infinite',
        bgShift:      'bgShift 12s ease-in-out infinite',
        twinkle:      'twinkle var(--dur,2.5s) ease-in-out infinite',
        float:        'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
