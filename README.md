# Onyx UI

一套**克制、稳重**的组件库：CSS 负责全部视觉与状态，一个 3.8 KB 的核心脚本只补上 CSS 做不到的事，
其余的（代码容器、抽屉、Toast）拆成了**按需引入的扩展**。
主操作使用近黑「墨色」而非蓝色，层次靠 1px 边框、留白与极轻的投影建立，而不是大圆角和重阴影。

| | |
| --- | --- |
| 依赖 | **0**（页面侧零依赖；构建侧只有 esbuild 一个 devDependency） |
| 体积 | 构建产物 gzip 后：核心 **10.5 KB**（CSS 8.9 + JS 1.6），全量 **15.9 KB** |
| 构建 | `npm run build`（`src/` → `static/`）；不想装 Node 就直接引 `src/` 里的源码 |
| 主题 | 浅色 / 深色，跟随系统或强制指定，支持任意子树局部换肤 |
| 组件 | 30+ 个组件与变体，全部由 `--ox-*` 变量驱动 |
| 无障碍 | `:focus-visible` 焦点环、原生表单元素、`aria-*` 驱动状态、`role="alert"` / `aria-live` 通知、尊重 `prefers-reduced-motion` |
| 移动端 | hover 仅发给指针设备（触屏不粘滞）、44px 触摸目标、16px 表单控件（防 iOS 缩放）、触摸端默认不可选文本、`touch-action: manipulation` |

> **CSS 与 JS 的边界**：所有视觉与状态（悬停、聚焦、校验、深浅色、下拉菜单展开）都由 CSS 完成；
> JS 只补 CSS 表达不了的东西 —— 下拉菜单的**关闭/键盘导航/视口翻转**、**触摸按下反馈**，
> 以及三个可选扩展（代码容器、抽屉、Toast）。一个脚本都不引入时，页面依旧完全可用。

---

## 目录结构

```
src/                           源码（唯一真相源，不会直接上线）
  onyx-ui.css                    核心样式
  onyx-ui.js                     核心交互：下拉菜单 + 触摸反馈
  extensions/
    onyx-code.css   onyx-code.js       代码容器 + 复制 + 高亮配色
    onyx-drawer.css onyx-drawer.js     移动端抽屉
    onyx-toast.css  onyx-toast.js      通知 / Toast
  docs/docs.css   docs/docs.js    展示页专用（不属于组件库）

static/                        构建产物：最小化 + 合并，页面直接引这里
  onyx-ui.min.css     onyx-ui.min.js          核心
  onyx-code.min.*     onyx-drawer.min.*       扩展，各一份
  onyx-toast.min.*
  onyx-ui.full.min.*                          核心 + 全部扩展，一个文件搞定
  docs.min.*                                  展示页专用

build.mjs                      构建脚本（esbuild）
package.json                   只有 esbuild 一个 devDependency
index.html                     组件展示 / 文档页
vendor/prism/                  演示页用的高亮引擎（Prism 1.29 / MIT，可换成任意引擎或删掉）
```

**核心只装每个页面都要的东西**：布局、主题、组件样式、下拉菜单、触摸反馈。
Toast、抽屉、代码容器这些“高级组件”拆成了扩展，不用就不会下载一个字节。

## 构建

```bash
npm install      # 只装 esbuild
npm run build    # src/ → static/
```

构建做三件事：**剥离各源文件的头部注释 → 拼接 → 最小化**，然后统一盖上一行 banner。
`onyx-ui.full.min.*` 是「核心 + 全部扩展」的合并版，引一个文件等于引八个 ——
不想管依赖顺序、也不在乎多下载几 KB 时用它。

产物一律是 UTF-8（`charset: 'utf8'`，不会把中文标签转义成 `\xxxx`），
CSS 会补回被压缩器丢掉的 `@charset "UTF-8";`。

### 直接使用（不构建）

不想装 Node 也行：`src/` 里的文件本来就是可直接引用的普通 CSS / JS。
把 `src/` 整个拷进项目，改引源码路径即可，功能完全一致 —— 只是没有最小化。

### 引入方式（用产物）

```html
<!-- 1 · 核心（必需） -->
<link rel="stylesheet" href="static/onyx-ui.min.css">
<script src="static/onyx-ui.min.js" defer></script>

<!-- 2 · 扩展（可选，必须在核心之后） -->
<link rel="stylesheet" href="static/onyx-code.min.css">
<link rel="stylesheet" href="static/onyx-drawer.min.css">
<link rel="stylesheet" href="static/onyx-toast.min.css">

<script src="static/onyx-code.min.js" defer></script>
<script src="static/onyx-drawer.min.js" defer></script>
<script src="static/onyx-toast.min.js" defer></script>

<!-- 或者：一个文件顶上面全部 -->
<link rel="stylesheet" href="static/onyx-ui.full.min.css">
<script src="static/onyx-ui.full.min.js" defer></script>
```

扩展彼此独立、只依赖核心。核心从来不按名字调用扩展，而是通过
`OnyxUI.onInit(fn)` 让扩展自己挂进来 —— 所以少引一个扩展不会报错，
只是对应的功能静静缺失。

| 产物 | raw | gzip | 说明 |
| --- | --- | --- | --- |
| `onyx-ui.min.css` | 43.1 KB | **8.9 KB** | 核心样式（必需） |
| `onyx-ui.min.js` | 3.8 KB | **1.6 KB** | 下拉菜单 + 触摸反馈 |
| `onyx-code.min.*` | 3.5 + 3.2 KB | 1.1 + 1.4 KB | 代码容器 + 复制（不含高亮引擎） |
| `onyx-drawer.min.*` | 0.9 + 2.8 KB | 0.5 + 1.2 KB | 移动端抽屉 |
| `onyx-toast.min.*` | 3.2 + 7.5 KB | 1.1 + 2.7 KB | 通知 |
| **`onyx-ui.full.min.*`** | 50.5 + 17.1 KB | **10.3 + 5.6 KB** | 核心 + 全部扩展 |

**核心 gzip 后约 10.5 KB**，全量约 15.9 KB。相比最小化前（核心 16.1 + 3.5 = 19.6 KB）
砍掉了大约一半。

---

## 主题

```html
<html>                     <!-- 跟随系统（默认） -->
<html data-theme="light">  <!-- 强制浅色 -->
<html data-theme="dark">   <!-- 强制深色 -->
```

`data-theme` 也可以挂在任意元素上，只影响该子树：

```html
<aside data-theme="dark">…</aside>
```

实现上使用 `color-scheme: light dark` + `light-dark()`；不支持 `light-dark()` 的旧浏览器会自动退回浅色主题，
功能不受影响。所有颜色变量都在 `:root` 中提供了浅色回退值，因此**无需额外 JS 即可跟随系统**。

---

## 设计变量

覆盖变量即可换肤，组件标记不用改：

```css
:root {
  --ox-primary: #131519;   /* 主按钮 / 聚焦环 / 强调 */
  --ox-radius-md: 10px;    /* 控件圆角 */
  --ox-h-md: 42px;         /* 控件高度 */
}
```

### 颜色

| 变量 | 说明 |
| --- | --- |
| `--ox-primary` `-hover` `-active` `--ox-on-primary` | 墨黑主色及其悬停 / 按下 / 前景色 |
| `--ox-success` `--ox-warning` `--ox-danger` `--ox-info` `--ox-purple` | 语义色，各带 `-hover`、`-active` |
| `--ox-*-soft` `--ox-*-soft-hover` | 淡色底（徽章、软色按钮、错误态光晕） |
| `--ox-*-text` | 淡色底上的文字色，保证对比度 |
| `--ox-page` | 页面背景 |
| `--ox-surface` `--ox-surface-2` `--ox-surface-3` | 三级表面（卡片 / 填充 / 悬停） |
| `--ox-surface-hover` | 软色中性按钮的悬停底色 |
| `--ox-border` `--ox-border-strong` | 常规边框 / 强调边框 |
| `--ox-text` `--ox-text-muted` `--ox-text-subtle` `--ox-text-inverse` | 四级文字 |
| `--ox-disabled-bg` `--ox-disabled-fg` | 禁用态（文字/输入框）；勾选类控件另用 `--ox-text-subtle` 做中灰填充 |
| `--ox-ring` `--ox-ring-danger` `--ox-ring-success` | 聚焦光晕 |

### 尺寸与其它

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `--ox-radius-xs\|sm\|md\|lg\|xl\|pill` | 6 / 8 / 10 / 14 / 18 / 999 px | 圆角梯度 |
| `--ox-h-xs\|sm\|md\|lg` | 26 / 34 / 42 / 48 px | 控件高度 |
| `--ox-shadow-xs\|sm\|md\|lg` | — | 四级投影 |
| `--ox-container-w` | `1180px` | `.ox-container` / `.ox-navbar__inner` 最大宽度 |
| `--ox-sidebar-w` | `256px` | `.ox-sidebar` 宽度 |
| `--ox-navbar-h` | `60px` | 导航栏高度（同时决定 sticky 侧边栏的偏移） |
| `--ox-sp-1…10` | 4…40 px | 间距梯度 |
| `--ox-fs-xs…3xl` | 12…25 px | 字号梯度 |
| `--ox-font-sans` `--ox-font-mono` | 系统字体栈 | 字体 |
| `--ox-dur` `--ox-dur-slow` `--ox-ease` `--ox-ease-out` | — | 动效时长与缓动 |
| `--ox-dur-toast-in` `--ox-dur-toast-out` `--ox-ease-toast` | 520ms / 260ms | 通知进出场时长与缓动 |
| `--ox-scrollbar-size` | `10px` | 全局滚动条粗细 |
| `--ox-scrollbar-thumb` `--ox-scrollbar-thumb-hover` | — | 滚动条滑块及其悬停色 |
| `--ox-scrim` | — | 抽屉遮罩色 |
| `--ox-selection` | — | 划词高亮底色（浅 `#d4dae4` / 深 `#39414e`），由 `::selection` 使用 |

---

## 滚动条

库默认就接管了全局滚动条（无需额外类名）：细、圆角、轨道透明，滑块只在悬停时变深。

```css
:root {
  --ox-scrollbar-size: 10px;
  --ox-scrollbar-thumb: #cfd5dd;
  --ox-scrollbar-thumb-hover: #a9b1bd;
}

/* 想交还给系统默认，或者换成自己的样式 */
::-webkit-scrollbar-thumb { background-color: rebeccapurple; }
```

实现要点：Chromium / Safari 用 `::-webkit-scrollbar` 系列伪元素（能控制圆角、悬停），Firefox 在
`@supports not selector(::-webkit-scrollbar)` 里用标准的 `scrollbar-width: thin` + `scrollbar-color`。
**不要同时使用两者** —— 一旦声明了非 `auto` 的 `scrollbar-width`/`scrollbar-color`，Chromium 会忽略
`::-webkit-scrollbar` 的全部样式。滑块用「透明边框 + `background-clip: padding-box`」实现，
所以 10px 的可点区域里显示的是 4px 的细滑块。

---

## 布局与工具类

| 类名 | 说明 |
| --- | --- |
| `.ox-container` | 居中定宽容器（`--ox-container-w` + 左右 20px padding） |
| `.ox-stack` | 纵向流式布局，间距用 `style="--ox-stack-gap:24px"` 调整 |
| `.ox-row` `.ox-row--tight` | 横向自动换行排列 |
| `.ox-grid` `--2` `--3` `--auto` | 网格；`--2/--3` 在 760px 以下自动塌成单列 |
| `.ox-spacer` | `flex:1`，把后续内容推到另一端 |
| `.ox-divider` `--v` `--labelled` | 分隔线（带标签时用 `div`，文本写在标签内） |
| `.ox-sr-only` | 仅供读屏器读取 |
| `.ox-hide-sm` | 视口 ≤ 640px 时隐藏（导航栏里的可选文字用） |
| `.ox-scrim` | 抽屉遮罩，由 `OnyxUI.drawer` 自动创建 |
| `.ox-no-scroll` | 锁住页面滚动（抽屉打开时自动加在 `body` 上） |
| `.ox-w-full` `.ox-text-center` `.ox-mono` | 常用工具类 |
| `.ox-text-muted` `.ox-text-subtle` `.ox-text-success` `.ox-text-danger` | 文字颜色工具类 |
| `.ox-noselect` `.ox-selectable` | 强制不可选中 / 强制可选中（用于触摸端默认不可选的反向覆盖） |

```html
<div class="ox-container ox-stack" style="--ox-stack-gap:28px">
  <div class="ox-row">…</div>
  <div class="ox-grid ox-grid--3">…</div>
</div>
```

---

## 文本样式

| 类名 | 规格 | 用途 |
| --- | --- | --- |
| `.ox-display` | 40px / 700 / -0.032em | 首屏主标题 |
| `.ox-h1` | 30px / 690 | 页面标题 |
| `.ox-h2` | 23px / 670 | 区块标题 |
| `.ox-h3` | 18px / 650 | 小节标题 |
| `.ox-h4` | 15px / 650 | 卡片内标题 |
| `.ox-lead` | 17px / 1.62 / muted | 导语 |
| `.ox-body` | 14px / 1.68 | 正文 |
| `.ox-small` | 13px / 1.6 | 辅助信息 |
| `.ox-caption` | 12px / subtle | 注释、图表说明 |
| `.ox-overline` | 11px 大写 + 0.09em | 章节小标题 |
| `.ox-quote` | 左侧 3px 竖线 | 引用 |
| `.ox-code` | 等宽 + 浅底 + 圆角 | 代码块本件（`<pre class="ox-code">`） |
| `.ox-codeblock` | 代码容器 | 标题栏 + 复制按钮 + 可横向滚动的代码区（见下方组件 API） |
| `.ox-prose` | 富文本容器 | 自动排版内部的 `h1-h4 / p / ul / ol / li / a / strong / code / blockquote / hr`，列宽限制 68ch |

```html
<article class="ox-prose">
  <h2>发布说明</h2>
  <p>正文段落，支持 <strong>强调</strong>、<code>行内代码</code> 与 <a href="#">链接</a>。</p>
  <ul><li>列表项</li></ul>
</article>
```

> 另有 `.ox-title` / `.ox-subtitle` / `.ox-label` / `.ox-help` 用于组件内部（卡片标题、字段标签、表单提示）。

---

## 移动端与触摸

触摸屏没有 hover，而浏览器在点按后会「保留」`hover` 状态直到你点别处 —— 控件看起来像卡住了。
Onyx UI 的做法是：**hover 只发给真正的指针设备，触摸设备改为按下反馈。**

### 1 · hover 全部收进 `@media (hover: hover)`

库里 25 条 hover 规则无一例外。所以手机上点按钮不会留下悬停底色，点导航不会再留下展开的下划线，
卡片不会浮起来回不去，点输入框也不会把边框留在悬停色。

```css
/* ✅ 正确写法 */
@media (hover: hover) {
  .ox-btn--primary:hover { box-shadow: var(--ox-shadow-sm); }
}

/* ❌ 在触屏上会粘住 */
.ox-btn--primary:hover { box-shadow: var(--ox-shadow-sm); }
```

自己做二次开发时请沿用这个约定；`.ox-navbar__link.is-hover` 是给文档 / 截图 / SSR 用的静态替身。

### 2 · 按下反馈（这不是纯 CSS 的事）

把 hover 关掉之后，按下反馈就成了触摸设备**唯一**的反馈。但只靠 `:active` 不够，有两个坑：

1. **iOS Safari 默认不会触发 `:active`** —— 只有页面上存在 `touchstart` 监听时才启用。
2. **tap 只有 ~80ms**，即使触发了也几乎看不见；长按还可能被系统手势/上下文菜单打断。

所以 `onyx-ui.js` 直接接管按下态：

| 时机 | 动作 | 效果 |
| --- | --- | --- |
| `pointerdown`（非鼠标） | 加 `.is-pressed` | 按下时就有反馈，按多久都不会被取消 |
| `pointerup` / `pointercancel` | 换成 `.is-tapped` | 播放 0.34s 回弹动画，按下的动作“看得见” |

```css
@media (hover: none) {
  .ox-btn.is-pressed { transform: scale(.96); transition-duration: 0s; }
  .ox-btn.is-tapped { animation: ox-tap-release .34s var(--ox-ease-out); }
}
```

按下时**立即到位**、松开时**缓慢回弹**，这是触摸手感的关键。鼠标路径完全不走这套（`pointerType === 'mouse'` 直接返回），桌面仍然是 `:active`。

不引入 `onyx-ui.js` 时退回纯 CSS：`:active` 仍在（iOS 上需要自己加一个 touchstart 监听）。

| 元素 | 触摸按下时 |
| --- | --- |
| `.ox-btn` | `scale(.96)` + 释放回弹动画 |
| `.ox-card--interactive` | `scale(.985)` + 投影加深 |
| `.ox-navbar__link` | 文字加深 + 下划线展开 |
| `.ox-sidebar__item` / `.ox-dropdown__item` | 背景切到 `--ox-surface-3` |
| `.ox-segmented__item` | 文字加深 |

### 3 · 选中文字：桌面上是主动行为，触摸上是意外

长按一个控件时，浏览器会把这当成「划词」手势：选中控件上的文字，
iOS 还会弹出「拷贝 / 查询」菜单盖在控件上 —— 这会直接打断长按看 Tooltip。
Android Chrome 另有一个默认行为：在你点到的元素上闪一层**半透明黑矩形**
（`-webkit-tap-highlight-color: auto` 的默认值），看起来就像控件被按坏了。

#### 3.1 · 控件不可选（全平台）

库自己有按下反馈，这些原生「噪音」只会打架，所以在 Reset 里一次性关掉：

```css
:where(html) { -webkit-tap-highlight-color: transparent; }

:where(button, summary, [role="button"], [role="tab"], [role="menuitem"],
       .ox-btn, .ox-choice, .ox-switch, .ox-segmented, .ox-navbar,
       .ox-sidebar__item, .ox-dropdown__item, .ox-card--interactive, .ox-badge) {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;   /* iOS 的「拷贝 / 查询」浮层 */
}
```

需要给自定义元素关掉选中时，直接加工具类 `.ox-noselect`。

#### 3.2 · 触摸端默认「不可选」，只留该复制的

桌面用户划词是**主动**的；手机上长按却是**惯性**的 —— 本来只是想按一下卡片，
手多停半秒就选中了半段文字，还把 iOS 浮层一起带出来。所以触摸端把默认值反过来：

| 内容 | 桌面（`pointer: fine`） | 触摸（`pointer: coarse`） |
| --- | --- | --- |
| 正文 / 卡片 / 提示条 / 通知 | 可选中 | **不可选中** |
| 控件（按钮、导航、列表项……） | 不可选中 | 不可选中 |
| `pre` `code` `kbd` `.ox-code` | 可选中 | **可选中** |
| `input` `textarea` `select` | 可选中 | **可选中** |
| 代码容器的标题栏 | 不可选中 | 不可选中 |

```css
@media (pointer: coarse) {
  /* 默认全关 */
  :where(body) { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  /* …再把该复制的打开 */
  :where(input, textarea, select, pre, code, kbd, samp, [contenteditable],
         .ox-code, .ox-selectable) {
    -webkit-user-select: text; user-select: text; -webkit-touch-callout: default;
  }
}
```

桌面不受影响（整块都在媒体查询里）。业务上确实需要在手机上划词的内容
（例如要复制的报错信息），给它加 `.ox-selectable` 即可。

顺手把划词高亮也纳入了色板 —— 浏览器默认的蓝色块和这套灰阶格格不入，
某些 Android 上甚至接近纯黑，会被误认为「黑色矩形阴影」：

```css
::selection { background-color: var(--ox-selection); }   /* 浅 #d4dae4 / 深 #39414e */
```

### 4 · 触摸目标 ≥ 44px

按 iOS HIG（44pt）与 Material（48dp）。**视觉尺寸不变**，只扩大热区：

```css
@media (pointer: coarse) {
  .ox-btn::before { content: ""; position: absolute; left: 0; right: 0;
                    top: 50%; height: max(100%, 44px); transform: translateY(-50%); }
}
```

热区只向上下扩展、**不向左右扩展**，所以 `.ox-btn-group` 里紧挨着的按钮不会被误触。
列表类（`.ox-sidebar__item`、`.ox-dropdown__item`）直接改成 `min-height: 44px`，因为它们有空间。

### 5 · 表单控件字号 16px

iOS Safari 会让**字号小于 16px** 的输入框在聚焦时放大整个页面。触摸设备下
`.ox-input / .ox-textarea / .ox-select` 自动升到 16px（`--sm` 也一样，防缩放优先）。

### 6 · 其它

| 项 | 触摸设备上的行为 |
| --- | --- |
| `touch-action` | 可点击元素统一 `manipulation` —— 去掉 300ms 点按延迟与双击缩放 |
| 滚动条 | `::-webkit-scrollbar` 宽度归零（定制滚动条会占 10px 布局宽度，触摸设备用原生浮层滚动条） |
| Toast 倒计时 | 只在**真实鼠标**下暂停；手机点一下不会触发 `mouseenter` 导致倒计时永久停住（`onyx-toast` 扩展） |
| Toast 进度条 | 同上，`animation-play-state` 由 JS 按指针类型控制（`onyx-toast` 扩展） |
| **Tooltip** | 触屏没有 hover，改为**长按显示、松手消失**（`.is-pressed` 由 JS 设置；另保留 `:active` 作为无 JS 时的兑底） |
| 下拉菜单 | `max-height: min(420px, 100dvh - 32px)` + 可滚动，矮屏 / 横屏不会溢出 |
| 侧边栏 | ≤ 1024px 变抽屉，内部独立滚动，`100dvh` 高度（`onyx-drawer` 扩展） |

### 7 · 怎么自己验证

Chrome DevTools 里点「切换设备工具栏」（Ctrl+Shift+M）选一台手机 —— DevTools 会把
`hover` 媒体特性一并切成 `none`，此时**任何 hover 样式都不该再出现**。

---

## JavaScript（核心 + 扩展）

全部无依赖、UMD 包装，共用一个全局 `window.OnyxUI`：核心创建它，扩展往上面挂方法。

| 文件 | 提供 |
| --- | --- |
| `onyx-ui.js` | `OnyxUI.init` `OnyxUI.onInit` `OnyxUI.dropdown` `OnyxUI.util` |
| `extensions/onyx-drawer.js` | `OnyxUI.drawer` |
| `extensions/onyx-toast.js` | `OnyxUI.toast` |
| `extensions/onyx-code.js` | `OnyxUI.copy` `OnyxUI.codeblock` |

扩展之间互不依赖，**但都必须在核心之后加载**（没加载核心时扩展会在控制台留一条警告并退出）。
如果你用构建工具，可以自己拼成一个文件；手写 `<script>` 的话按顺序写就行。

```js
// 扩展通过 onInit 钩子挂进来，核心不需要知道谁被加载了
OnyxUI.onInit(function (root) { /* root 每次 init 的范围 */ });
OnyxUI.util;   // { closest, on, visible } —— 写自己的扩展时可以直接用
```

### 1 · 下拉菜单行为（核心）

引入脚本后，所有 `details.ox-dropdown` 自动获得：

| 行为 | 说明 |
| --- | --- |
| 点击空白关闭 | 无需手动监听 |
| `Esc` 关闭 | 并把焦点归还给触发按钮 |
| `↑` `↓` `Home` `End` | 在菜单项间循环移动；在收起的 `<summary>` 上按 `↓`/`↑` 会直接展开并定位到首 / 末项 |
| `Tab` | 关闭菜单 |
| 视口翻转 | 靠近屏幕底部时自动向上弹出、靠近右侧时自动右对齐（写入 `data-flip="up"` / `data-flip="end"`） |

标记层可选的两个开关：

| 属性 | 作用 |
| --- | --- |
| `data-ox-close` | 点该菜单项后关闭菜单 |
| `data-ox-check` | 该菜单项可勾选：点击切换 `is-checked` 与 `aria-checked`，且**不**关闭菜单 |

动态插入标记后调用 `OnyxUI.init(root)` 重新扫描即可（幂等）。

### 2 · Toast 通知（`onyx-toast` 扩展）

需要用 `OnyxUI.toast()` 时才引入；Toast 也在 `pointer: coarse` 下自动禁用 hover 粘滞。

```js
OnyxUI.toast('已保存');

OnyxUI.toast({
  variant: 'success',            // neutral | info | success | warning | danger
  title: '部署完成',
  description: 'release/2.4 已上线 3 个区域。',
  position: 'top-right',         // top|bottom × left|center|right
  duration: 4200,                // 毫秒；0 = 常驻；鼠标悬停 / 聚焦时自动暂停
  dismissible: true,             // 关闭按钮
  icon: true,                    // 可变体图标，false 则不显示
  max: 4,                        // 同一角落最多堆叠几条，超出挤掉最旧的
  id: null,                      // 带上 id 即可原地更新同一条
  action: { label: '撤销', onClick: fn, closeOnClick: true },
  onClose: function (node) {}
});
```

| API | 说明 |
| --- | --- |
| `OnyxUI.toast(options \| string)` | 创建通知，返回通知元素 |
| `OnyxUI.toast.success / info / warning / danger / neutral(same)` | 快捷方法 |
| `OnyxUI.toast.update(id, options)` | 原地更新同 `id` 的通知（进度、状态流转） |
| `OnyxUI.toast.dismiss(node \| id)` | 关闭指定通知 |
| `OnyxUI.toast.clear(position?)` | 清空全部，或只清某个角落 |
| `OnyxUI.init(root?)` | 重新扫描下拉菜单（幂等） |

**行为细节**

- 通知容器 `.ox-toaster[data-position]` 首次调用时自动创建，清空后自动移除。
- **进出场动画**：每条通知从所在方向的边缘**水平滑入**（右上/右下从右边、左上/左下从左边、居中位置从左偏 32px），
  位移始终沿 X 轴，没有纵向漂移也没有缩放。透明度在前 38% 就到位，所以看起来是「实体滑进来」而不是「淡出来」。
  默认滑入 520ms、滑出 260ms，可用 `--ox-dur-toast-in` / `--ox-dur-toast-out` / `--ox-ease-toast` 调整。
- 鼠标移入或键盘进入会同时暂停 **JS 倒计时** 与 **CSS 进度条**（`animation-play-state`）。
- `danger` 使用 `role="alert"`（打断式），其余为 `role="status"`，容器带 `aria-live="polite"`。
- 文案一律用 `textContent` 写入，不会把用户输入当 HTML 解析。
- 同一个 `id` 重复调用是**更新**而不是新增，适合「上传中 → 完成」这类流程。

**静态用法**：不引入脚本也能拿到同样的外观，直接写标记即可：

```html
<div class="ox-toast ox-toast--success" style="animation:none">
  <svg class="ox-toast__icon">…</svg>
  <div class="ox-toast__body">
    <p class="ox-toast__title">部署完成</p>
    <p class="ox-toast__desc">release/2.4 已上线 3 个区域。</p>
    <div class="ox-toast__actions"><button class="ox-btn ox-btn--link ox-btn--sm">查看日志</button></div>
  </div>
  <button class="ox-toast__close" aria-label="关闭">…</button>
</div>
```

### 3 · 代码容器（`onyx-code` 扩展）

引入脚本后，页面上每一个 `<pre class="ox-code">` 会被自动包进 `.ox-codeblock` 容器并补上工具栏，
**旧标记一行都不用改**。工具栏承载标题与复制按钮，而复制按钮放在工具栏里、不再悬浮在代码右上角，
所以它永远不会压住代码的第一行（此前靠给 `<pre>` 留 76px 右内边距来避开）。

```html
<!-- 最简：交给脚本升级 -->
<pre class="ox-code">&lt;link rel="stylesheet" href="static/onyx-ui.min.css"&gt;</pre>

<!-- 显式：自己写工具栏（已被 onyx-ui.js 认领，不会再注入一个） -->
<div class="ox-codeblock">
  <div class="ox-codeblock__bar">
    <span class="ox-codeblock__title">index.html</span>
    <button type="button" class="ox-btn ox-btn--ghost ox-btn--xs ox-codeblock__copy">复制</button>
  </div>
  <pre class="ox-code">&lt;link rel="stylesheet" href="static/onyx-ui.min.css"&gt;</pre>
</div>
```

属性（写在 `<pre>` 上）：

| 属性 | 作用 |
| --- | --- |
| `data-title` | 工具栏左侧的标题，如 `index.html`；不写则不渲染标题元素 |
| `data-copy-label` | 空闲文案，默认跟随 `<html lang>`（`zh-*` → 「复制」，否则 `Copy`） |
| `data-copied-label` | 成功文案，默认「已复制 / Copied」 |
| `data-failed-label` | 失败文案，默认「手动复制 / Copy manually」 |

```js
OnyxUI.copy('文本')                       // → Promise，复制
OnyxUI.codeblock.init('#dynamic')         // 动态插入标记后再扫一遍
OnyxUI.codeblock.labels.copy = 'Kopieren' // 全局改文案
```

复制走 `navigator.clipboard`；**非安全上下文**（例如用 `http://192.168.x.x` 做局域网预览）
会自动回退到 `textarea + execCommand`，所以局域网里也能用。

#### 3.1 · 语法高亮

**高亮引擎不打包进库**。库里只有两样东西：一个 opt-in 开关（`data-lang`）
和一套 token 配色。引擎随你挑，也可以一个都不引。

````md
```html
<!-- 1 · 引擎：外置，先于扩展加载（演示页用的是 Prism） -->
<script src="vendor/prism/prism.min.js"></script>
<script src="vendor/prism/prism-json.min.js"></script>

<!-- 2 · 扩展：产物在 static/，源码在 src/extensions/ -->
<link rel="stylesheet" href="static/onyx-code.min.css">
<script src="static/onyx-code.min.js"></script>
````

```html
<!-- 3 · 想让哪块高亮，就写上 data-lang -->
<pre class="ox-code" data-lang="html">&lt;button class="ox-btn"&gt;保存&lt;/button&gt;</pre>
<pre class="ox-code" data-lang="css">.ox-btn { color: red; }</pre>
<pre class="ox-code">不写 data-lang 就是纯文本，不执行任何高亮</pre>
```

为什么这么设计：

| 取舍 | 结果 |
| --- | --- |
| 不打包引擎 | 库体积不因为高亮变大；不想用高亮的页面一个字节都不多付 |
| `data-lang` 显式开启 | **不猜**。自动识别经常猜错，把普通文本里的字符染成奇怪颜色比不高亮更糟糕 |
| 引擎没加载 | `data-lang` 被静静忽略，代码块退化成纯文本框 —— 不报错、不破样式 |

已内置的兼容映射（写在 `onyx-code.css` 里）：

| 引擎 | 类名 |
| --- | --- |
| Prism | `.token.comment` `.token.tag` `.token.attr-name` `.token.string` `.token.keyword` `.token.number` `.token.function` `.token.punctuation` … |
| highlight.js | `.hljs-comment` `.hljs-tag` `.hljs-attr` `.hljs-string` `.hljs-keyword` `.hljs-number` `.hljs-title` `.hljs-built_in` … |
| 自己写 | `.ox-tok-comment` `.ox-tok-tag` `.ox-tok-attr` `.ox-tok-string` `.ox-tok-keyword` `.ox-tok-number` `.ox-tok-func` `.ox-tok-punct` |

也就是说：**换引擎不用改 CSS，接 Prism 也不用引 Prism 主题**（那套主题自带背景色与内边距，
会和 `.ox-codeblock` 打架）。配色统一走变量：

```css
/* 默认值由语义色派生，所以深浅色主题自动跟随；想改直接覆盖 */
:root {
  --ox-tok-comment: var(--ox-text-subtle);
  --ox-tok-string: var(--ox-success-text);
  --ox-tok-keyword: var(--ox-purple-text);
  --ox-tok-number: var(--ox-warning-text);
  --ox-tok-tag: var(--ox-info-text);
  --ox-tok-attr: var(--ox-warning-text);
  --ox-tok-func: var(--ox-info-text);
  --ox-tok-regex: var(--ox-danger-text);
  --ox-tok-operator: var(--ox-text-muted);
  --ox-tok-punct: var(--ox-text-subtle);
}
```

两个容易被忽略的细节：

1. **复制拿到的是纯文本** —— 高亮把 `<span>` 写进 `pre` 之后，`pre.textContent` 仍然是原文，
   粘贴出去没有标签垃圾（已有断言：`copied === pre.textContent`）。
2. **手动补高亮** —— 动态插入的代码块调 `OnyxUI.codeblock.init(root)`，
   只想重跑某一块则用 `OnyxUI.codeblock.highlight(pre)`（已高亮过的会跳过，不会叠层）。

---

### 移动端取舍

导航栏在窄屏上最容易“错位”，库提供了三层兼顾：

1. **按钮永不被压缩** —— `.ox-navbar__link` 与 `__actions` 是 `flex: none`，不会被挤成细条（按钮被压到 17px 宽是之前最明显的问题）。
2. **`__nav` 可横向滚动** —— ≤ 640px 时链接区变成可横向滑动的条，而不是撑破页面。
   真机上更好的做法是把导航收进抽屉，用 `.ox-hide-md` 隐藏整个 `__nav`。
3. **两档工具类** —— `.ox-hide-sm`（≤ 640px 隐藏）用来收掉次要链接、行动按钮、分隔符与文字标签；
   `.ox-hide-md`（≤ 1024px 隐藏）用来在平板/手机下隐藏整块内容。≤ 400px 时导航栏的内边距与间距会自动收紧。

```html
<a class="ox-navbar__link ox-hide-sm" href="#">成员</a>   <!-- 手机上收起 -->
<nav class="ox-navbar__nav ox-hide-md">…</nav>          <!-- 换成抽屉里的导航 -->
```

`.ox-dropdown` 的菜单也会自动避让视口：先判断上下空间决定是否向上弹出，再测量左右边界做水平位移，
确保 320px 宽度下也不会被推出屏幕。

---

## 组件 API

### Button · `.ox-btn`

```html
<button class="ox-btn ox-btn--primary">保存</button>
```

| 修饰符 | 效果 |
| --- | --- |
| `--primary` | **墨黑实心**，主操作（悬停提亮到 `--ox-primary-hover` + 投影加深） |
| `--secondary` | 白底 + 边框，次操作 |
| `--ghost` | 无底色，悬停出现浅底 |
| `--link` | 内联文字按钮，强调色 + 悬停下划线 |
| `--soft` | 中性淡色底 |
| `--soft-info` `--soft-success` `--soft-danger` | 语义淡色底 + 同色文字 |
| `--info` `--success` `--danger` | 语义实心（文字用 `--ox-on-primary`，深浅色自动适配） |
| `--xs` `--sm` `--lg` | 尺寸（默认 `md` = 42px 高） |
| `--pill` `--block` `--icon` | 胶囊 / 撑满 / 正方形图标按钮 |
| `is-loading` | 隐藏内容并显示与前景色一致的转圈 |

- 禁用使用原生 `disabled`；非按钮元素用 `aria-disabled="true"`。
- `.ox-btn-group` 把多个按钮拼接成一组（自动首尾圆角与边框合并）：

```html
<div class="ox-btn-group">
  <button class="ox-btn ox-btn--secondary ox-btn--sm">Day</button>
  <button class="ox-btn ox-btn--secondary ox-btn--sm">Week</button>
</div>
```

### 表单 · `.ox-field` `.ox-input` `.ox-textarea` `.ox-select`

```html
<div class="ox-field">
  <label class="ox-label" for="email">Email</label>
  <input class="ox-input" id="email" type="email" placeholder="your@email.com">
  <p class="ox-help">辅助说明</p>
</div>
```

| 类名 / 修饰符 | 说明 |
| --- | --- |
| `.ox-field` | 纵向单元：标签 + 控件 + 提示 |
| `.ox-label` | 12px 大写字母间距标签；`.ox-label--plain` 取消大写 |
| `.ox-help` `--error` `--success` | 提示文字（灰 / 红 / 绿） |
| `.ox-input` `.ox-textarea` `.ox-select` | 42px 高、10px 圆角、1px 边框 |
| `--sm` `--lg` | 34px / 48px |
| `is-focus` | 静态模拟聚焦态（用于截图或说明） |
| `is-error` `is-success` 或 `[aria-invalid="true"]` | 校验态：彩色边框 + 4px 同色光晕 |
| `.ox-input-group` | 前后缀容器，子级 `__addon--prefix` / `__addon--suffix` |
| `.ox-input-icon` | 左侧内嵌图标容器（图标绝对定位，输入框自动加左内边距） |
| `.ox-select-wrap` | 必须包裹原生 `<select>`，用于绘制自绘箭头 |

> 原生 `<select>` 的**弹出层由操作系统绘制，CSS 无法定制**。需要分组、图标、快捷键提示等富菜单时，
> 请改用下面的 `.ox-dropdown`。

### 选择控件 · `.ox-choice` `.ox-switch`

```html
<label class="ox-choice">
  <input type="checkbox" checked><span class="ox-choice__box"></span>记住我
</label>

<label class="ox-choice">
  <input type="radio" name="plan"><span class="ox-choice__dot"></span>Team
</label>

<label class="ox-switch">
  <input type="checkbox" checked><span class="ox-switch__track"></span>邮件摘要
</label>
```

`<input>` 必须**紧邻**自定义盒子（使用 `+` 兄弟选择器），焦点环、禁用态、选中态都由 CSS 接管。

#### 禁用态

禁用态用原生 `disabled`。**触摸设备没有光标**，所以不能只靠 `cursor: not-allowed` 暗示，
得让像素自己说话（旧版只给盒子加 `opacity: .55`，既没盖到 label 的文字节点，
即使盖到了 55% 的「选中」看着仍然是「选中」）。现在形状也跟着变：

| 状态 | 看相 |
| --- | --- |
| 普通 · 未选 | `--ox-surface` 实心底 + `--ox-border-strong` 实线框 + 正文色文字 |
| 普通 · 已选 | `--ox-primary` 填充 + `--ox-on-primary` 勾（墨黑 / 近白） |
| **禁用 · 未选** | **虚线框**（`--ox-text-subtle`）+ `--ox-disabled-bg` 下沉底色 + `--ox-text-subtle` 文字 |
| **禁用 · 已选** | **中灰实心填充**（`--ox-text-subtle`）+ `--ox-surface` 勾 —— 永远不用品牌主色 |

```css
/* 未选：虚线 = 关着，而且是「死」的 */
.ox-choice input:disabled + .ox-choice__box { border-style: dashed; border-color: var(--ox-text-subtle);
                                             background: var(--ox-disabled-bg); }
/* 已选：中灰填充，与品牌的墨黑/近白一眼分得开 */
.ox-choice input:disabled:checked + .ox-choice__box { background: var(--ox-text-subtle); color: var(--ox-surface); }
```

`.ox-switch` 用同一套语言：关·禁用 = 虚线跑道，开·禁用 = 中灰跑道。
文字色与 `cursor: not-allowed` 挂在 `:has(input:disabled)` 上，不支持 `:has()` 的旧浏览器
仍然能拿到盒子与跑道的样式。

### 分段控件 · `.ox-segmented`

```html
<div class="ox-segmented" role="tablist">
  <button class="ox-segmented__item" role="tab" aria-selected="true">概览</button>
  <button class="ox-segmented__item" role="tab" aria-selected="false">日志</button>
</div>
```

### 下拉菜单 · `.ox-dropdown`

基于原生 `<details>` / `<summary>`，**零 JavaScript** 即可展开、收起，并支持键盘进入与操作。

```html
<details class="ox-dropdown ox-dropdown--end">
  <summary class="ox-btn ox-btn--secondary">
    账号菜单
    <svg class="ox-dropdown__caret" width="12" height="12" viewBox="0 0 24 24">…</svg>
  </summary>

  <div class="ox-dropdown__menu">
    <div class="ox-dropdown__head">
      <div class="ox-user">
        <span class="ox-avatar ox-avatar--sm ox-avatar--ink">MK</span>
        <span class="ox-user__body">
          <span class="ox-user__name">Mia Kim</span>
          <span class="ox-user__meta">mia@acme.com</span>
        </span>
      </div>
    </div>

    <div class="ox-dropdown__sep"></div>

    <p class="ox-dropdown__label">环境</p>
    <a class="ox-dropdown__item is-checked" href="#">Production</a>
    <button class="ox-dropdown__item" type="button">Staging</button>
    <button class="ox-dropdown__item ox-dropdown__item--danger" type="button">删除项目</button>
    <div class="ox-dropdown__sep"></div>
    <p class="ox-dropdown__empty">没有匹配项</p>
  </div>
</details>
```

| 类名 / 修饰符 | 说明 |
| --- | --- |
| `.ox-dropdown` | 相对定位容器（`<details>`） |
| `.ox-dropdown--end` | 菜单右对齐 |
| `.ox-dropdown--up` | 向上弹出 |
| `.ox-dropdown--wide` | 最小宽度 300px |
| `__menu` | 菜单面板（白底、14px 圆角、大投影、入场动画） |
| `__item` | 菜单项（`a` / `button` 均可），`--danger` 危险色，`is-checked` 选中加粗 |
| `__item--danger` | 危险操作（红字 + 红色悬停底） |
| `__label` `__sep` `__head` `__empty` | 分组标题 / 分隔线 / 头部容器 / 空状态 |
| `__caret` | 触发按钮里的箭头，展开时旋转 180° |
| `__trail` | 靠右的内容（徽章、`.ox-kbd`） |

**注意**

1. 父级如果有 `overflow: hidden`（例如 `.ox-card--clip`），菜单会被裁切 —— 可改用 `--up`，或把菜单移到不裁切的容器中。
2. 引入 `onyx-ui.js` 后，点击空白关闭、`Esc`、方向键导航与视口边缘翻转全部自动生效；
   不引入脚本时菜单仍可正常展开收起，只是需要再点一次 `<summary>` 才能收起。
3. 由于 `.ox-card` 默认不再裁切内容，卡片内可以直接放下拉菜单。

### 导航栏 · `.ox-navbar`

```html
<header class="ox-navbar ox-navbar--sticky">
  <div class="ox-navbar__inner">
    <a class="ox-navbar__brand" href="/">
      <span class="ox-navbar__brand-mark">A</span>Acme
    </a>

    <nav class="ox-navbar__nav">
      <a class="ox-navbar__link is-active" href="#">控制台</a>
      <a class="ox-navbar__link" href="#">报表</a>
    </nav>

    <div class="ox-navbar__actions">
      <span class="ox-navbar__sep"></span>
      <button class="ox-navbar__link ox-navbar__link--icon" aria-label="搜索"><svg …/></button>
      <button class="ox-btn ox-btn--primary ox-btn--sm">升级套餐</button>
    </div>
  </div>
</header>
```

| 类名 / 修饰符 | 说明 |
| --- | --- |
| `--sticky` | 吸顶 + 半透明毛玻璃 |
| `--flush` | 内容区撑满宽度（不限 `--ox-container-w`） |
| `--solid` | 取消半透明 |
| `--bordered` | 额外加一层底部投影 |
| `__inner` | 定宽居中容器，高度 `--ox-navbar-h` |
| `__brand` `__brand-mark` | 品牌区与方形标记 |
| `__nav` `__link` | 导航区与**导航按钮**。默认无底色，悬停 / 当前态是一条从**中心向两侧展开**的下划线（`scaleX 0→1`，0.28s），文字颜色同步加深；当前页的下划线用墨黑，悬停用当前文字色 |
| `__link.is-active` / `.is-hover` | `is-active` 当前页；`is-hover` 是悬停态的静态替身（文档 / 截图 / SSR 用，不依赖鼠标） |
| `__link--icon` | 正方形图标按钮。没有文字可划线，因此保留浅色底反馈 |
| `__link--menu` | 汉堡按钮。默认隐藏，≤ 1024px 显示，配合 `data-ox-drawer-open` 开关抽屉 |
| `__link--pill` | 可选：回到旧的「浅色药丸」反馈，同时关掉下划线 |
| `__link--collapse` | 视口 < 640px 时隐藏 |
| `__actions` `__sep` | 右侧操作区 / 竖分隔线 |

`.ox-navbar__link` 是「导航按钮」的载体：默认是弱化文字色，悬停与当前态都靠一条从中心展开的下划线表达，
不再使用浅色底——这样导航栏在视觉上更安静，也避免了与卡片、下拉触发器的底色撞车。
下划线的两端跟随 `--_px`（与 `padding` 同源）自动与文字对齐，改 `padding` 时不用另外调：

```css
.ox-navbar__link { --_px: 16px; }   /* 下划线与文字同步变宽 */
```

需要底部整条时（如 Tabs 风格），或想要旧的药丸反馈，用 `--pill` 修饰符即可。

### 侧边栏 · `.ox-sidebar`

```html
<aside class="ox-sidebar ox-sidebar--sticky">
  <nav class="ox-sidebar__group">
    <p class="ox-sidebar__title">工作区</p>
    <a class="ox-sidebar__item is-active" href="#overview">
      <svg width="15" height="15">…</svg>总览
    </a>
    <a class="ox-sidebar__item" href="#analytics">
      <svg width="15" height="15">…</svg>分析
      <span class="ox-sidebar__count">7</span>
    </a>
  </nav>
  <div class="ox-sidebar__footer">…</div>
</aside>
```

| 类名 / 修饰符 | 说明 |
| --- | --- |
| `.ox-sidebar` | 定宽纵向栏（宽度 `--ox-sidebar-w`），纵向间距 20px |
| `--sticky` | 跟随滚动、独立溢出，偏移自动使用 `--ox-navbar-h` |
| `__group` | 一组导航项 |
| `__title` | 分组标题（11px 大写） |
| `__item` | 导航项；`is-active` 时浅底 + 加重 + **左侧 3px 墨黑指示条** |
| `__count` | 右侧计数徽标（等宽数字） |
| `__footer` | 置底区域（分隔线上方） |
| `__header` `__header-title` | 抽屉形态下的标题栏（含关闭按钮），桌面下自动隐藏 |
| `--drawer` | **≤ 1024px 时变成抽屉菜单**：脱离文档流、从左侧滑入、高度 `100dvh`、内部独立滚动 |

#### 移动端抽屉

```html
<!-- 1 · 侧边栏：加 --drawer 与一个 id -->
<aside class="ox-sidebar ox-sidebar--sticky ox-sidebar--drawer" id="nav" tabindex="-1">
  <div class="ox-sidebar__header">
    <span class="ox-sidebar__header-title">组件大纲</span>
    <span class="ox-spacer"></span>
    <button class="ox-btn ox-btn--ghost ox-btn--icon ox-btn--sm" data-ox-drawer-close aria-label="关闭">…</button>
  </div>
  <nav class="ox-sidebar__group">…</nav>
  <div class="ox-sidebar__footer">…</div>
</aside>

<!-- 2 · 触发器：汉堡按钮，≤ 1024px 才显示 -->
<button class="ox-navbar__link ox-navbar__link--icon ox-navbar__link--menu"
        data-ox-drawer-open="#nav" aria-controls="nav" aria-expanded="false" aria-label="打开大纲">…</button>
```

`onyx-ui.js` 负责的行为：

| 行为 | 说明 |
| --- | --- |
| 遮罩 | 首次打开时自动创建 `.ox-scrim`（浅色 42% / 深色 62% 黑），点击遮罩关闭 |
| `Esc` | 关闭并把焦点交还给触发器 |
| 滚动锁 | 打开时给 `body` 加 `.ox-no-scroll`，关闭时移除 |
| 焦点循环 | 抽屉内 `Tab` / `Shift+Tab` 在首尾循环，不会跑出抽屉 |
| 点击链接 | 点抽屉内的链接（如目录跳转）自动收起 |
| 断点回退 | 窗口变回桌面宽度时自动关闭，避免留下遮罩 |

```js
OnyxUI.drawer.open('#nav' /* 或元素 */, triggerEl);
OnyxUI.drawer.close();
OnyxUI.drawer.toggle(el, triggerEl);
```

**实现细节**：抽屉只对 `transform` 做过渡，`visibility` 保持即时切换（否则元素处于未渲染状态，
过渡永远不会推进，抽屉将无法收起、焦点还会落进屏幕外内容）——关闭时由 JS 先把
`visibility: visible` 内联保持住，等 `transitionend`（或 400ms 兜底）再交还给样式表。

不引入 `onyx-ui.js` 时，抽屉标记在桌面就是普通侧边栏，在小屏则保持隐藏（不会被误展开）。

### 卡片 · `.ox-card`

```html
<article class="ox-card ox-card--interactive">
  <div class="ox-card__header">
    <div class="ox-card__heading">
      <h3 class="ox-card__title">月度账单</h3>
      <p class="ox-card__desc">2026 年 9 月</p>
    </div>
    <span class="ox-spacer"></span>
    <span class="ox-badge ox-badge--success">已结清</span>
  </div>

  <div class="ox-card__body">…</div>

  <div class="ox-card__footer">
    <button class="ox-btn ox-btn--secondary ox-btn--sm">下载发票</button>
  </div>
</article>
```

| 修饰符 | 说明 |
| --- | --- |
| `--interactive` | **鼠标进入时轻微上浮 2px + 投影从 xs 加深到 md**，`:focus-within` 同样生效 |
| `--raised` | 常驻 `--ox-shadow-md` 投影 |
| `--float` | 去边框 + `--ox-shadow-lg` 大投影 |
| `--clip` | 开启 `overflow: hidden`（内容含出血图片时才需要） |

结构：`__header`（`--plain` 去掉下边框）/ `__heading` / `__title` / `__desc` / `__body`（`--tight` `--flush`）/ `__footer`。

### 头像与用户 · `.ox-avatar` `.ox-user`

```html
<span class="ox-avatar ox-avatar--sm">SM</span>
<span class="ox-avatar ox-avatar--ink ox-avatar--presence">
  JD<span class="ox-avatar__presence ox-avatar__presence--online"></span>
</span>

<div class="ox-avatar-group">
  <span class="ox-avatar ox-avatar--ink">JD</span>
  <span class="ox-avatar">MK</span>
  <span class="ox-avatar">+2</span>
</div>

<a class="ox-user" href="/u/jane">
  <span class="ox-avatar ox-avatar--ink">JD</span>
  <span class="ox-user__body">
    <span class="ox-user__name">Jane Doe</span>
    <span class="ox-user__meta">jane@acme.com</span>
  </span>
</a>
```

| 类名 | 说明 |
| --- | --- |
| `.ox-avatar` `--sm` `--lg` | 36 / 28 / 46 px 圆形头像，内容可用首字母或 `<img>` |
| `--ink` | 墨黑底 + 反色文字 |
| `--squircle` `--ring` | 圆角方形 / 外圈描边 |
| `--presence` + `__presence` | 右下角状态点：默认离线，`--online` `--away` `--busy` |
| `.ox-avatar-group` | 自动重叠 -10px 并加描边分隔 |
| `.ox-user` | 头像 + `__body`(`__name` / `__meta`) 的横向身份行 |

### 徽章 · `.ox-badge`

```html
<span class="ox-badge ox-badge--success"><span class="ox-badge__dot"></span>Active</span>
```

| 修饰符 | 说明 |
| --- | --- |
| `--neutral` `--success` `--warning` `--danger` `--info` `--purple` | 语义配色（淡底 + 深字） |
| `--sm` | 22px 高、11px 字 |
| `--outline` | 描边款 |
| `--pulse` | 状态点带光晕，用于「实时 / 在线」 |

### 提示与反馈

| 组件 | 类名 | 修饰符 |
| --- | --- | --- |
| 提示条 | `.ox-alert` | `--info` `--success` `--warning` `--danger`（淡底 + 左侧 3px 色条）、`--solid`（实心）；子级 `__icon` `__title` `__text` |
| 进度条 | `.ox-progress` | `__bar` 的宽度用内联 `style`；`--lg` `--success` `--danger` |
| 骨架屏 | `.ox-skeleton` | `--text`（胶囊）/ `--circle`；尺寸用内联 `style` |
| 快捷键 | `.ox-kbd` | — |
| 气泡提示 | `.ox-tooltip` | 文本写在 `data-tooltip` 属性上；鼠标悬停显示，触摸端由 `onyx-ui.js` 改为长按显示 |
| 统计数字 | `.ox-stat` | `__value` `__label`，数字使用等宽数位 |
| **通知** | `.ox-toast` | `--neutral / --info / --success / --warning / --danger`；
子级 `__icon` `__body` `__title` `__desc` `__actions` `__close` `__progress`；
容器 `.ox-toaster[data-position]`，由 `OnyxUI.toast()` 自动创建。详见「JavaScript · Toast 通知」 |

---

### 代码容器 · `.ox-codeblock`

| 部件 | 说明 |
| --- | --- |
| `.ox-codeblock` | 外层容器：边框 + 圆角 + 代码底色，`overflow: hidden` |
| `.ox-codeblock__bar` | 工具栏：`--ox-surface-3` 底色 + 下边框，最小高 38px，**不可选中** |
| `.ox-codeblock__title` | 标题（等宽、超长省略），值来自 `<pre data-title>` |
| `.ox-codeblock__copy` | 复制按钮，**最小宽 68px** —— 文案在「复制 / 已复制」间切换时按钮不会抽动 |
| `.ox-code` | 内部代码区：去掉自身边框与圆角，成为横向滚动容器 |

```html
<div class="ox-codeblock">
  <div class="ox-codeblock__bar">
    <span class="ox-codeblock__title">nginx.conf</span>
    <button type="button" class="ox-btn ox-btn--ghost ox-btn--xs ox-codeblock__copy">复制</button>
  </div>
  <pre class="ox-code">server {
  listen 80;
}</pre>
</div>
```

工具栏与复制按钮由 `extensions/onyx-code.js` 自动补齐（见「JavaScript · 代码容器」）；
不引入脚本时 `.ox-code` 仍然是一个可用的代码块，只是没有工具栏。
内部的代码区在触摸端属于「可选中」白名单 —— 手机上也长按可复制。

语法高亮是**opt-in** 的：在 `<pre>` 上写 `data-lang="html"`，扩展会把内容交给页面上已有的
高亮引擎（Prism / highlight.js），库里只负责提供 token 配色变量 `--ox-tok-*`。
不写 `data-lang`，或页面上没有引擎 —— 都不会报错，代码块退回纯文本。详见
「JavaScript · 代码容器 · 语法高亮」。

---

## 约定

1. **主按钮是墨黑**（`--ox-primary: #131519`）。深色模式自动反转为近白并配深色文字；
   语义色只用于表达语义，不与主操作争夺注意力。
2. **实心色块上的文字**统一用 `--ox-on-primary`，深浅色自动适配；不要在语义按钮上写死 `#fff`。
3. **过渡只用颜色 / 投影 / 位移**，不使用 `filter: brightness()`（在深色主题下方向会反，且没有过渡动画）。
4. **状态优先用原生属性驱动**：`disabled`、`aria-invalid`、`aria-selected`、`aria-disabled`；
   与之等价的 class（`is-error`、`is-success`、`is-focus`、`is-loading`、`is-active`）仅作补充。
5. 所有类名以 `ox-` 前缀 + `--修饰符` + `__子元素` 命名，不会与业务样式冲突。
6. **脚本只做一件事**：把 CSS 表达不了的行为挂上去。能不写 JS 就不写 —— Toast 的静态样式、
   下拉菜单的展开收起都是纯 CSS，脚本只是增强。所有事件监听均在 `document` 上委托且只绑定一次。

## 浏览器支持

| 浏览器 | 表现 |
| --- | --- |
| Chrome / Edge 123+、Safari 17.5+、Firefox 120+ | 完整深浅双主题（`light-dark()`） |
| 更早版本 | 自动退化为浅色主题，其余功能完全一致 |

`color-mix()` 仅用于毛玻璃背景的渐进增强，不支持时退回纯色。
`onyx-ui.js` 使用 ES5 级语法 + `Object.assign` / `Map` / `IntersectionObserver` 之外的少量现代特性，
IE 不在支持范围内。

## 变更记录

**v1.7.0 · 源码归位 `src/` + 构建产出 `static/`**

- 重构：源码全部移入 `src/`（核心、三个扩展、展示页专用资源），
  新增 `build.mjs` + `package.json`（唯一的 devDependency 是 esbuild）
- 新增 `npm run build`：剥离各文件头部注释 → 拼接 → 最小化 → 统一盖一行 banner，产出到 `static/`
- 新增 `onyx-ui.full.min.*`（核心 + 全部扩展）：一个文件顶八个，不想管引入顺序时用
- **体积腰斩**：核心 gzip 从 19.6 KB 降到 **10.5 KB**（CSS 8.9 + JS 1.6）
- 展示页改为直接引 `static/` 产物 —— 你在页面上看到的就是发布产物，等于每次打开都在做回归
- 细节：`charset: 'utf8'` 保证中文标签不被转义成 `\xxxx`；
  CSS 补回被压缩器丢掉的 `@charset "UTF-8";`；
  banner 统一为一行，拼接后不会出现六份版权块

**v1.6.0 · 核心瘦身 + 按需扩展 + 语法高亮**

- 重构：把「高级组件」从核心拆成三个**可选扩展**，用到才下载

  | 文件 | 内容 |
  | --- | --- |
  | `extensions/onyx-code.css` `onyx-code.js` | 代码容器 + 复制 + 高亮配色 |
  | `extensions/onyx-drawer.css` `onyx-drawer.js` | 移动端抽屉 + 遮罩 |
  | `extensions/onyx-toast.css` `onyx-toast.js` | 通知卡片 + `OnyxUI.toast()` |

  核心 JS 从约 20 KB 降到 **11 KB**（gzip 3.5 KB），核心 CSS 停在 71 KB（gzip 16.1 KB，还含新增的高亮配色）；
  核心不再按名字调用扩展，改用 `OnyxUI.onInit(fn)` 钩子 + `OnyxUI.util` 共享工具，
  所以少引一个扩展只会静静缺失功能，不会报错
- 新增：**语法高亮**（外置引擎，库不带引擎）。在 `<pre>` 上写 `data-lang` 即开启，
  不写即纯文本；已内置 Prism / highlight.js 双套类名 → `--ox-tok-*` 变量的映射，
  **换引擎不用改 CSS，也不需要引 Prism 主题**；配色由语义色派生，深浅色主题自动跟随
- 新增：`OnyxUI.codeblock.highlight(pre)` 手动补高亮
- 修复：高亮后复制仍然只拿到**纯文本**（`copied === pre.textContent`）
- 展示页：17 个代码块全部补上 `data-lang` 并启用高亮（演示页自带 `vendor/prism/`，可整体删掉）

**v1.5.0 · 代码容器 + 触摸端默认不可选文本**

- 新增组件 `.ox-codeblock`：代码容器，工具栏承载标题与复制按钮。
  复制按钮不再悬浮在代码右上角（以前靠给 `<pre>` 留 76px 右内边距避开第一行），
  按钮文案在「复制 / 已复制」间切换时因 `min-width: 68px` 而不会抽动
- 新增 `OnyxUI.copy(text)` 与 `OnyxUI.codeblock`：`<pre class="ox-code">` 会被自动包进容器并补上工具栏，
  **旧标记无需改动**；复制优先走 `navigator.clipboard`，非安全上下文（局域网 HTTP）回退 `execCommand`；
  文案跟随 `<html lang>`，可用 `OnyxUI.codeblock.labels` 或 `data-*` 属性覆盖
- 展示页的代码展示改用库容器：删除 `docs.css` 的 `.doc-codeblock` / `.doc-copy`
  与 `docs.js` 的复制实现，避免文档页重复造轮子
- 变更：触摸设备（`pointer: coarse`）**默认不可选中文本** —— 手机上长按是惯性动作，
  很容易误选中半段文字并带出 iOS 浮层。`pre / code / kbd / input / textarea / select`
  以及 `.ox-code` 保持可选中，其余需要划词的内容加 `.ox-selectable`

**v1.4.3 · 勾选类控件的禁用态可辨识**

- 修复：`.ox-choice` / `.ox-switch` 的禁用态几乎看不出禁用 —— 旧样式是
  `input:disabled ~ * { opacity: .55 }`，而 label 里的文字是**文本节点**，`~ *` 根本匹配不到它，
  所以实际只有那个 18px 的小框淡了一点
- 改用**不依赖光标**的视觉语言（触摸端没有指针变化）：未选 = 虚线框 + 下沉底色，
  已选 = 中灰实心填充（不再用品牌墨黑），文字统一转 `--ox-text-subtle`
- 补齐：`.ox-switch` 此前**完全没有**禁用样式
- 展示页补上四个「已选 / 未选 × 禁用」对照组

**v1.4.2 · 触摸不再误选文字**

- 修复：长按按钮 / 列表项 / 开关会**选中控件上的文字**，iOS 还会弹出「拷贝 / 查询」
  浮层盖住控件（刚好打断长按看 Tooltip）。现在 Reset 里统一 `user-select: none` + `-webkit-touch-callout: none`
- 修复：Android Chrome 点按控件时闪现的**半透明黑矩形**（`-webkit-tap-highlight-color` 默认值），
  现在全局置为 `transparent`
- 新增：`.ox-noselect` 工具类，给自定义元素关掉选中
- 新增：`--ox-selection`，划词高亮改用中性灰蓝（浅 `#d4dae4` / 深 `#39414e`），
  不再使用浏览器默认蓝块，也不再在暗色主题下接近纯黑
- 阅读内容（`.ox-prose` / 卡片正文 / `.ox-alert` / 代码块）与表单控件**不受影响**，仍可正常划词复制

**v1.4.1 · 触摸反馈修正**

- 修复：把 hover 关掉后，触摸设备上按钮**完全没有任何反馈**（按下无变化）。
  原因是 iOS Safari 只在页面存在 `touchstart` 监听时才触发 `:active`，且 tap 只有 ~80ms 根本看不清
- 新增：`onyx-ui.js` 接管按下态 —— `pointerdown` 加 `.is-pressed`（按下期间持续生效），
  `pointerup` / `pointercancel` 换成 `.is-tapped` 播放 0.34s 回弹动画
- 新增：触摸设备上 **tooltip 改为长按显示、松手消失**（之前完全无法触发）。
  按钮与 tooltip 容器分开查找（tooltip 通常包裹按钮，单个 `closest()` 永远只能找到按钮）
- 鼠标路径完全不受影响（按 `pointerType` 分流）：桌面依旧是 hover + `:active`

**v1.4 · 移动端与触摸**

- 修复：触摸设备上控件会**粘在 hover 态**（点完按钮/导航/卡片后样式不恢复）。
  库里 25 条 hover 规则全部收进 `@media (hover: hover)`，触摸设备改用 `:active` 反馈
- 新增：触摸目标 ≥ 44px（用 `::before` 扩大热区，视觉尺寸不变；只向上下扩展，
  所以 `.ox-btn-group` 里紧贴的按钮不会被误触）；列表项直接 `min-height: 44px`
- 新增：触摸设备下表单控件字号升到 16px，避免 iOS Safari 聚焦时放大页面
- 新增：可点击元素统一 `touch-action: manipulation`（去掉 300ms 延迟与双击缩放）
- 修复：触摸设备上定制滚动条会占 10px 布局宽度 → `pointer: coarse` 下宽度归零，改用原生浮层滚动条
- 修复：Toast 倒计时在手机上被永久暂停（点一下会触发 `mouseenter` 却没有 `mouseleave`）——
  现改为只在 `pointerType === 'mouse'` 时暂停，键盘焦点用 `:focus-visible` 判定
- 修复：下拉菜单在矮屏/横屏溢出 → `max-height: min(420px, 100dvh - 32px)` + 内部滚动
- 新增 `:active` 按下反馈：按钮 `scale(.97)`、卡片 `scale(.985)`、列表项切换底色

**v1.3.1 · 移动端修复**

- 修复：窄屏下导航栏整体“压扁错位” —— `.ox-navbar__link` 未设 `flex: none`，汉堡按钮被压成 17px、
  中间导航被压成 0px、用户名溢出被裁，页面横向溢出 182px
- 修复：**已折叠的 `<details>` 内的下拉菜单仍参与布局**（UA 只给 `content-visibility: hidden`），
  把菜单推出屏幕、撑宽整个页面；现关闭时 `display: none`
- 修复：下拉菜单会被推出视口（390px 下右边界达 486px），现按视口测量并做水平位移收敛
- 新增：`.ox-hide-md`（≤1024px 隐藏），并新增 `.ox-hide-sm` 的更多用途；≤ 640px 时 `.ox-navbar__nav` 可横向滚动；
  ≤ 400px 时导航栏间距自动收紧
- 修复：移动端长内联代码（`--ox-xxx`）撑破布局，现允许断行
- 文档：预览页在手机宽度下重新取舍（导航链接与用户名收进抽屉），全宽度 320→1440 无横向溢出

**v1.3**

- 新增：`.ox-sidebar--drawer` —— 侧边栏在 ≤ 1024px 下变为抽屉菜单（遮罩、Esc、滚动锁、
  焦点循环与归还、点击链接自动收起、断点回退），由 `extensions/onyx-drawer.js` 提供行为
- 新增：全局滚动条样式（细滑块 + 透明轨道 + 悬停加深），Chromium/Safari 用 `::-webkit-scrollbar`，
  Firefox 用 `scrollbar-width` / `scrollbar-color`；可用 `--ox-scrollbar-*` 主题化
- 修复：导航栏「切换深色」误用 `--icon`（固定 34px 宽），内部 54px 的文字溢出按钮 22px，
  导致悬停底色与文字错位；现改为宽度自适应的普通导航按钮
- 新增：`.ox-navbar__link--menu`（仅 ≤ 1024px 显示的汉堡按钮）与工具类 `.ox-hide-sm`
- 抽屉高度改用 `100dvh`，避免移动端浏览器工具栏收起时底部内容被截断

**v1.2.1**

- 导航栏按钮 `.ox-navbar__link` 的悬停 / 当前态由「浅色底」改为**从中心向两侧展开的下划线**
  （`::after` + `scaleX`，0.28s 减速动画，文字颜色同步加深；当前项下划线为墨黑）
- 新增 `.ox-navbar__link.is-hover`（静态模拟悬停）与 `.ox-navbar__link--pill`（回到旧样式）
- 图标按钮 `.ox-navbar__link--icon` 保留浅色底反馈（无文字可划线）

**v1.2**

- 新增 `onyx-ui.js`（可选，UMD、无依赖）：下拉菜单交互增强 + `OnyxUI.toast()` 通知系统
- 新增 Toast 通知组件：5 种语义、6 个弹出位置、自动消失与悬停暂停、进度条、操作按钮、
  同 `id` 原地更新、堆叠上限、`role="alert"` / `aria-live` 无障碍支持
- 通知进出场改为**纯水平滑入**（从所在方向的边缘滑入，520ms / 260ms，不再有纵向位移与缩放），
  可用 `--ox-dur-toast-in` / `--ox-dur-toast-out` / `--ox-ease-toast` 调整；退出时机由 `animationend` 驱动，
  避免动画被截断
- 下拉菜单：点击空白 / `Esc` 关闭、`↑↓ Home End` 键盘导航、`data-ox-close` 与 `data-ox-check` 标记、
  视口边缘自动翻转（`data-flip`）
- 文档页：每个组件区块的复现代码块加了一键复制按钮，新增 Toast 实倒区块
- 文档页与库的职责彻底分离：库只依赖 `onyx-ui.css`（+ 可选 `onyx-ui.js`）

**v1.1**

- 新增：`.ox-navbar`（导航栏 / 导航按钮）、`.ox-dropdown`（纯 CSS 下拉菜单）、`.ox-sidebar`（侧边栏）、
  文本预设（`.ox-display` ~ `.ox-caption`、`.ox-quote`、`.ox-code`、`.ox-prose`）
- 新增：`.ox-card--interactive` 卡片悬停反馈、`.ox-avatar--presence` 在线状态点、`.ox-user` 身份行
- 修复：语义实心按钮 hover 无过渡（`filter` → 色阶变量）
- 调整：主按钮 hover 提亮更明显（`#131519 → #2f333a`），并同步加深投影
- 调整：`.ox-card` 默认不再 `overflow: hidden`（避免裁切下拉菜单与气泡），改由 `.ox-card--clip` 按需开启
- 调整：展示页的库样式与文档样式 / 脚本分离为 `onyx-ui.css` 与 `docs/`

**v1.0** 首个版本：按钮、表单、选择控件、徽章、提示、卡片、头像、进度、骨架屏等。
