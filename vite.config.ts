import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import dts from 'unplugin-dts/vite'
import type { UserConfig } from 'vite'

const config: UserConfig = {
  plugins: [
    vue(),
    dts({
      processor: 'vue',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['vite.config.ts'],
      copyDtsFiles: true,
      insertTypesEntry: true,
      cleanVueFileName: true,
      compilerOptions: {
        declarationMap: true,
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(process.cwd(), 'src/index.ts'),
      name: 'Vue3Dropzone',
      fileName: (format: string) => `Vue3Dropzone.${format}.js`,
      //@ts-ignore
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'vue',
        },
      },
    },
  },
}

export default config
