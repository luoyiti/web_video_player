# 多媒体管理中心（web_video_player）

一个基于原生 HTML / CSS / JavaScript 的本地多媒体管理 Demo，用于统一管理视频与照片，支持标签筛选、简单的集合概览和夜间模式切换。

> 本项目为前端示例项目，不依赖打包工具，也没有复杂的构建流程，适合作为练习或二次开发的起点。

---

## 功能概览

- **视频管理**
  - 左侧列表展示所有视频条目
  - 右侧播放器支持播放 / 暂停 / 进度控制
  - 为视频添加 / 删除标签
  - 支持临时添加本地视频文件（不上传，只在当前浏览器会话中可见）

- **照片管理**
  - 左侧缩略图网格展示照片
  - 右侧大图预览
  - 为照片添加 / 删除标签

- **媒体总览（集合管理）**
  - 独立页面 `library.html`
  - 将视频和照片统一以卡片形式展示
  - 按标签筛选媒体
  - 点击卡片跳转回主页面并自动定位到对应视频/照片

- **标签系统**
  - 标签筛选：在主页面与总览页都可以按标签过滤
  - 为单个媒体添加多个标签
  - 标签数据持久化到 `localStorage`

- **夜间模式**
  - 顶部导航栏提供“夜间模式”按钮
  - 日间 / 夜间配色基于 Twitter 风格
  - 主题偏好会保存至 `localStorage`，下次访问自动恢复

---

## 目录结构

```text
web_video_player/
├── index.html          # 主控制台：视频 / 照片管理
├── library.html        # 媒体总览（集合管理）
├── chagpt.html         # 原始单文件版本（保留作为备份）
├── backend.py          # 可选后端 Demo（用于持久化，可按需启用）
├── css/
│   └── styles.css      # 全局样式（Twitter + 夜间模式）
├── js/
│   ├── app.js          # 应用入口，初始化各模块
│   ├── config.js       # 配置与初始示例数据
│   ├── state.js        # 状态管理 & localStorage 持久化
│   ├── ui.js           # 所有 DOM 渲染逻辑
│   ├── events.js       # 事件绑定与交互逻辑
│   ├── api.js          # 与后端 `backend.py` 交互（可选）
│   ├── utils.js        # 工具函数（如 escapeHtml 等）
│   ├── library.js      # `library.html` 页面逻辑
│   └── theme.js        # 主题管理（日间 / 夜间模式切换）
├── data/
│   └── ...             # 示例数据或后端使用的数据文件
├── AGENTS.md           # 仓库使用说明（英文）
├── TWITTER_THEME_CHANGELOG.md # Twitter 主题样式修改记录
└── README_zh.md        # 本文件
```

---

## 运行方式

本项目不需要构建，只要有一个简单的 HTTP 服务器即可运行。

### 1. 启动本地服务器

在项目根目录下执行（macOS / Linux / Windows 均可）：

```bash
cd web_video_player
python3 -m http.server 8000
```

然后在浏览器中访问：

- 主页面：`http://localhost:8000/index.html`
- 总览页：`http://localhost:8000/library.html`

> 直接用 `file://` 打开 HTML 可能会因为浏览器安全策略导致模块脚本无法加载，所以推荐使用本地服务器。

### 2. 可选：启动后端（如果需要持久化到 SQLite 等）

如果你希望把部分标签 / 媒体信息同步到后端，可以参考 `backend.py` 中的实现自行扩展。一个典型的做法是：

```bash
python3 backend.py
```

然后在前端配置中（例如 `config.js` 或 `api.js`）指向对应的后端地址（默认假设为 `http://localhost:5001`）。

> 如果只是体验前端功能，可以完全忽略后端部分。

---

## 前端模块说明

### 1. `index.html`

主界面，分为左右两列：

- 左侧：
  - 标签筛选区
  - 本地视频添加表单
  - 视频列表 / 照片网格
- 右侧：
  - 视频播放区域
  - 视频标签编辑
  - 照片预览与标签编辑
- 顶部导航：
  - 视频管理 / 照片管理 Tab
  - “集合管理”链接跳转到 `library.html`
  - 夜间模式切换按钮

### 2. `library.html`

媒体总览页：

- 左侧为标签筛选与说明
- 右侧为媒体卡片网格
- 点击任意卡片，会：
  1. 记录当前选中的媒体 ID 和类型（视频 / 照片）到 `localStorage`
  2. 跳转回 `index.html#video` 或 `index.html#photo`
  3. 主页面根据记录自动切换到对应 Tab 并选中该媒体

### 3. `js/app.js`

- 创建并初始化：
  - `StateManager`：状态管理
  - `UIRenderer`：渲染器
  - `EventHandler`：事件处理
  - `ThemeManager`：主题管理
- 启动顺序：
  1. 初始化主题（读取系统偏好 & 本地存储）
  2. 从 `localStorage` 加载状态
  3. 根据 URL `hash` 切换当前 Tab
  4. 订阅状态变化并渲染 UI
  5. 绑定各种事件
  6. 可选：与后端同步

### 4. `js/state.js`

- 负责维护应用的单一状态树（videos / photos / 当前选中项 / 当前标签等）
- 通过 `localStorage` 保存和恢复状态
- 提供订阅机制：状态变更后通知 UI 重新渲染

### 5. `js/ui.js`

- 只负责根据 `state` 渲染 DOM，不直接修改状态
- 包含：
  - 视频列表 / 照片网格渲染
  - 当前视频 / 照片详情渲染
  - 标签列表与选中状态渲染

### 6. `js/events.js`

- 负责绑定界面上的各种交互事件：
  - Tab 切换（视频 / 照片）
  - 标签点击筛选
  - 添加 / 删除标签
  - 本地视频文件选择
  - 列表项点击切换当前播放媒体

### 7. `js/theme.js`

- 封装主题逻辑：
  - 从 `localStorage` 读取 `mediaManagerTheme`
  - 检测系统 `prefers-color-scheme: dark`
  - 为 `body` 添加或移除 `dark-mode` 类
  - 更新夜间模式按钮文案与图标

### 8. `js/library.js`

- 专用于 `library.html`
- 从 `StateManager` 读取所有媒体
- 按标签过滤
- 渲染统一卡片列表
- 处理卡片点击并跳转到主页面

---

## 自定义与扩展

你可以根据自己的需求进行以下扩展：

- 替换示例视频 / 照片路径为自己的资源
- 在 `config.js` 中调整初始数据结构
- 在 `api.js` 与 `backend.py` 中增加真实的上传 / 删除 / 标签同步接口
- 扩展夜间模式为多主题（例如高对比度主题）
- 增加搜索框、排序功能、分页等

---

## 开发建议

- 修改样式时，尽量复用 `:root` 中的 CSS 变量，便于维护主题
- 新增 DOM 结构时，优先使用现有的 class（如 `card`、`btn`、`tag-list` 等）保持视觉一致
- 如果要引入构建工具（如 Vite / Webpack），建议先把 `js/` 目录作为模块入口逐步迁移

---

如需我帮你扩展更多功能（例如真正的后端持久化、上传进度、批量操作等），可以直接在对话里告诉我你的具体想法。