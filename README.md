# Personal Daily Reports

将 `daily\YYYY-MM\` 中的普通 Markdown 日报生成一张清晰的单页长海报 PDF。

程序固定使用 1080 px 逻辑宽度，高度随正文自动增长。文字、色块、边框和 SVG 装饰直接写入矢量 PDF，放大后不会像整张 PNG 那样出现像素模糊。

## 首次安装

需要 Windows、Node.js 24、npm 和 Playwright Chromium。

```powershell
Set-Location 'H:\Workshop\PDR\personal-daily-reports'
npm.cmd install
npx.cmd playwright install chromium
```

## 写日报

原始日报始终放在对应月份目录中：

```text
daily\2026-08\2026-08-01.md
daily\2026-07\2026-07-30-31.md
```

支持的文件名：

- 单日：`YYYY-MM-DD.md`
- 同月连续多日：`YYYY-MM-DD-DD.md`

日报可以直接使用常见 Markdown：一级至三级标题、段落、有序/无序列表、引用、粗体、斜体、行内代码、链接、围栏代码块，以及独占一行的本地图片。

## 生成 PDF

单日示例：

```powershell
npm.cmd run report -- "daily\2026-08\2026-08-01.md"
```

生成：

```text
daily\2026-08\images\1.pdf
```

多日示例：

```powershell
npm.cmd run report -- "daily\2026-07\2026-07-30-31.md"
```

生成：

```text
daily\2026-07\images\30-31.pdf
```

日期前导零不会进入 PDF 文件名。例如 `2026-07-09-11.md` 会生成 `images\9-11.pdf`。

每次成功运行都会安全更新同名 PDF。程序不会生成 PNG、JSON、manifest 或额外日期目录，原始 Markdown 不会被修改。

## 只检查、不生成

```powershell
npm.cmd run report -- "daily\2026-07\2026-07-30-31.md" --dry-run
```

该命令检查文件路径、Markdown 和本地图片，并显示将要生成的 PDF 路径，但不会创建 `images` 目录或 PDF。

## 生成后打开目录

```powershell
npm.cmd run report -- "daily\2026-07\2026-07-30-31.md" --open
```

## 注意事项

- 本地图片路径相对于 Markdown 文件解析，并且必须位于项目目录内。
- 远程图片不会自动下载。
- 海报超过 10,000 px 高度时程序会提示警告；超过 16,000 px 时会停止，以免生成被浏览器截断的 PDF。
- PDF 是单页长海报，部分手机预览器初始会缩得较小，放大后文字仍保持清晰。

## 验证项目

```powershell
npm.cmd run test:all
```
