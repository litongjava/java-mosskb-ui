/**
 * 后端地址统一从这里读取，构建时由环境变量确定，改地址不需要改代码。
 *
 *   VITE_API_BASE_URL  后端 API 基础地址
 *     - 相对地址：/api           前端与后端同源部署（例如都挂在 api.maxkb.xyz 上）
 *     - 绝对地址：https://api.maxkb.xyz/api   前后端分域部署，浏览器直连后端
 *
 * 分享链接、文档链接、内嵌脚本、OAuth 回调、WebSocket 这些同样指向后端的地址
 * 都由它推导，所以只改这一个变量就能整体切换后端。
 */
const env = import.meta.env

/** 后端 API 基础地址，可能是相对地址，也可能是绝对地址 */
export const API_BASE_URL: string = env.VITE_API_BASE_URL || '/api'

/** 是否配置成了绝对地址（即前端与后端不同源） */
export const IS_REMOTE_API: boolean = /^https?:\/\//i.test(API_BASE_URL)

/** 后端根地址：绝对配置时取它的 origin，相对配置时与前端同源 */
export const SERVER_ORIGIN: string = IS_REMOTE_API
  ? new URL(API_BASE_URL).origin
  : window.location.origin

/** 后端 API 的绝对地址，用于展示、复制和回调等必须是完整地址的场景 */
const API_ABSOLUTE_URL: string = new URL(API_BASE_URL, window.location.origin).href.replace(
  /\/+$/,
  ''
)

/** 拼接后端根地址下的路径，例如 serverUrl('/doc/chat/') */
export function serverUrl(path = ''): string {
  return joinUrl(SERVER_ORIGIN, path)
}

/** 拼接后端 API 路径，例如 absoluteApiUrl('/application/')，相对配置也会补全为绝对地址 */
export function absoluteApiUrl(path = ''): string {
  return joinUrl(API_ABSOLUTE_URL, path)
}

/** 与后端建立 WebSocket 链接：地址里的 host 跟随后端，而不是前端 */
export function wsUrl(path: string): string {
  const api = new URL(API_BASE_URL, window.location.origin)
  const protocol = api.protocol === 'https:' ? 'wss://' : 'ws://'
  // 同源部署的生产构建仍然按历史行为带上前端部署路径，跨域时后端在根路径下
  const basePath = IS_REMOTE_API || env.DEV ? '' : env.VITE_BASE_PATH || ''
  return `${protocol}${api.host}${basePath}${path}`
}

function joinUrl(base: string, path: string): string {
  if (!path) {
    return base
  }
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
}
