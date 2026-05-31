export default defineNuxtConfig({
  ssr: false,

  modules: [
    '@nuxtjs/tailwindcss',
    '@vite-pwa/nuxt',
  ],

  app: {
    head: {
      title: 'Winai WordDrop',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'เกมฝึกสะกดคำสำหรับเด็ก' },
        { name: 'theme-color', content: '#7c3aed' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon',             type: 'image/png', href: '/icons/icon-192x192.png' },
        { rel: 'apple-touch-icon', type: 'image/png', href: '/icons/icon-180x180.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Mali:wght@400;600;700&family=Itim&display=swap',
        },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    injectRegister: 'inline',
    manifest: {
      name: 'Winai WordDrop',
      short_name: 'WordDrop',
      description: 'เกมฝึกสะกดคำสำหรับเด็ก',
      theme_color: '#7c3aed',
      background_color: '#f5f3ff',
      display: 'standalone',
      orientation: 'portrait',
      lang: 'th',
      icons: [
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        { src: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-stylesheets',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
          },
        },
      ],
    },
    devOptions: {
      enabled: false,
    },
  },

  tailwindcss: {
    configPath: '~/tailwind.config.js',
  },

  compatibilityDate: '2024-09-19',
})
