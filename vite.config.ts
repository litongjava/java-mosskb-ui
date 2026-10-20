import { fileURLToPath, URL } from 'node:url'
import type { ProxyOptions } from 'vite'
import { defineConfig, loadEnv } from 'vite'

import vue from '@vitejs/plugin-vue'
import DefineOptions from 'unplugin-vue-define-options/vite'

const envDir = './env'
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const ENV = loadEnv(mode, envDir)
  // 部署路径：命令行环境变量 > env 文件里的 VITE_DYNAMIC_PREFIX > VITE_BASE_PATH
  const prefix = process.env.VITE_DYNAMIC_PREFIX || ENV.VITE_DYNAMIC_PREFIX || ENV.VITE_BASE_PATH
  const proxyConf: Record<string, string | ProxyOptions> = {}
  proxyConf['/api'] = {
    target: ENV.VITE_PROXY_TARGET || 'http://127.0.0.1:10060',
    changeOrigin: true,
    rewrite: (path) => path.replace(ENV.VITE_BASE_PATH, '/'),
    configure: (proxy) => {
      // 流式回答走 SSE，需要向上游保持长连接。开发代理默认发 Connection: close，
      // 服务端会在写完响应头后关闭通道，导致回答分片（甚至整段回答）收不到。
      proxy.on('proxyReq', (proxyReq, req) => {
        if (req.url && req.url.includes('/chat_message/')) {
          proxyReq.setHeader('connection', 'keep-alive')
        }
      })
    }
  }
  proxyConf['/doc'] = {
    target: ENV.VITE_PROXY_TARGET || 'http://127.0.0.1:10060',
    changeOrigin: true,
    rewrite: (path) => path.replace(ENV.VITE_BASE_PATH, '/')
  }
  proxyConf['/static'] = {
    target: ENV.VITE_PROXY_TARGET || 'http://127.0.0.1:10060',
    changeOrigin: true,
    rewrite: (path) => path.replace(ENV.VITE_BASE_PATH, '/')
  }
  // 后端静态资源目录：知识库原文件按「目录名 + 相对路径」访问
  proxyConf['/pages'] = {
    target: ENV.VITE_PROXY_TARGET || 'http://127.0.0.1:10060',
    changeOrigin: true
  }
  return {
    preflight: false,
    lintOnSave: false,
    base: prefix,
    envDir: envDir,
    plugins: [vue(), DefineOptions()],
    server: {
      cors: true,
      host: '0.0.0.0',
      port: Number(ENV.VITE_APP_PORT),
      strictPort: true,
      proxy: proxyConf
    },
    build: {
      outDir: 'dist/ui'
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})
