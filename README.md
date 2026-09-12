# MatrixCore 导航页

极简 Vue 导航页，只提供网站链接和实时天气时钟。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建产物位于 `dist`。

## 配置

在 `.env` 中维护页面元信息、可选的百度统计 ID 与 `VITE_WEATHER_KEY`。链接内容在 `src/assets/siteLinks.json`。

页面时钟与昼夜主题统一按北京时间运行：06:00–17:59 使用日间样式，其他时间使用夜间样式。
