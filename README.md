# web

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## 环境变量与构建

后端地址通过环境变量配置，不需要改代码。vite 从 `env/` 目录读取环境文件，加载顺序是
`.env` → `.env.local` → `.env.[mode]` → `.env.[mode].local`，后面的覆盖前面的；只有 `VITE_`
开头的变量会注入到前端代码（`import.meta.env`）。

| 文件 | 用途 |
| --- | --- |
| `env/.env` | 所有环境共用：`VITE_APP_NAME`、`VITE_BASE_PATH`（部署路径）、`VITE_APP_PORT`、`VITE_APP_TITLE` |
| `env/.env.development` | `npm run dev`：`VITE_API_BASE_URL=/api` 走 vite 代理，`VITE_PROXY_TARGET` 指定真实后端 |
| `env/.env.production` | `npm run build`：`VITE_API_BASE_URL=https://api.maxkb.xyz/api` |
| `env/.env.local`、`env/.env.*.local` | 本机覆盖，已加入 `.gitignore`，不会提交 |

`VITE_API_BASE_URL` 的两种写法：

- 绝对地址，前后端分开部署：`VITE_API_BASE_URL=https://api.maxkb.xyz/api`，浏览器直接请求后端，
  需要后端允许跨域（本项目后端已返回 `access-control-allow-origin: *`）。
- 相对地址，前后端同源部署（例如前端就挂在 `https://api.maxkb.xyz/ui/`）：
  `VITE_API_BASE_URL=/api`，走同源请求。

文档链接、分享链接、内嵌脚本、OAuth 回调和 WebSocket 地址都由这一个变量推导，见
`src/utils/server.ts`，切换后端不需要改代码。

### 构建指向 api.maxkb.xyz 的前端

```powershell
cd java-mosskb-ui
npm install
npm run build          # 读取 env/.env.production，产出 dist/ui/
```

临时换后端地址（不改文件，命令行优先级最高）：

```powershell
# Windows PowerShell
$env:VITE_API_BASE_URL='/api'; npm run build
# Linux / macOS
VITE_API_BASE_URL=/api npm run build
```

只想跑类型检查或只构建产物：

```powershell
npm run type-check
npm run build-only
```

`npm run build` 的输出目录是 `dist/ui`，资源前缀由 `VITE_BASE_PATH` 决定（默认 `/ui/`）；
把前端部署到域名根目录时，在 `env/.env.production` 里设置 `VITE_BASE_PATH=/`。

### 开发时联调远端后端

不打开跨域也能连 `api.maxkb.xyz`：把代理指向它即可（改 `env/.env.development`）。

```env
VITE_API_BASE_URL=/api
VITE_PROXY_TARGET=https://api.maxkb.xyz
```

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
