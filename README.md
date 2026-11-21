# 大狗骑自行车5 · GitHub Pages 自动编译与发布

本项目为纯前端静态单页应用（React + TypeScript + Vite + Tailwind CSS），所有游戏存档、成就与等级均保存在浏览器 `localStorage` 中，可直接部署至 **GitHub Pages**。

## 自动编译与发布流程

仓库已内置工作流 `.github/workflows/deploy.yml`：

- 每次向 `main` 或 `master` 分支推送代码时（或在 GitHub 仓库 **Actions** 页面手动点击 **Run workflow**），都会自动执行：
  1. 安装依赖（自动兼容 `package-lock.json` 与无锁文件仓库）
  2. 运行 `npm run lint`（TypeScript 类型检查）
  3. 自动读取 GitHub Pages 仓库子路径并执行 `npm run build`
  4. 生成 `.nojekyll` 与 `404.html` 后自动发布至 GitHub Pages

## 在 GitHub 仓库开启自动发布（仅需 1 次）

1. 将代码推送到你的 GitHub 仓库的 `main` 或 `master` 分支。
2. 打开 GitHub 仓库页面 → **Settings** → **Pages**。
3. 在 **Build and deployment** → **Source** 中选择 **GitHub Actions**。
4. 回到 **Actions** 标签页等待工作流完成，即可通过显示的 `https://<你的用户名>.github.io/<仓库名>/` 地址在线游玩。

## 本地开发与构建

```bash
npm install
npm run dev      # 启动本地开发服务器
npm run lint     # TypeScript 类型校验
npm run build    # 构建静态产物至 dist/
```
