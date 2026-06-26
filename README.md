# 汉语拼音转换器

一个基于 React + Hono 全栈的汉语转拼音工具，优先使用百度汉语 API 获取准确拼音，失败时回退到本地 pinyin-pro 引擎。

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS + tRPC
- **后端**: Hono + tRPC + Zod
- **拼音引擎**: 百度汉语 API（代理）+ pinyin-pro（降级）

## 特性

- 输入汉字即时转换为带声调拼音
- 优先调用百度汉语 API，多音字更准确
- 支持显示/隐藏声调、分隔符切换、大小写切换
- 优雅的滚动揭示动效

## 开发

```bash
npm install
npm run dev     # 启动开发服务器
npm run build   # 构建生产版本
```

## License

MIT
