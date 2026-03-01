import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { rari } from 'rari/vite'
import { defineConfig } from 'rolldown-vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    rari(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/piper-tts-web/dist/onnx', dest: '.' },
        { src: 'node_modules/piper-tts-web/dist/piper', dest: '.' },
        { src: 'node_modules/piper-tts-web/dist/worker', dest: '.' },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      external: ['@huggingface/transformers'],
      output: {
        // Load the package from CDN at runtime instead of bundling it
        paths: {
          '@huggingface/transformers': 'https://esm.sh/@huggingface/transformers@3.8.1',
        },
      },
    },
  },
})
