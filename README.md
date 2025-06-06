# 2048 Game

一个基于 JavaScript 实现的 2048 游戏，具有美观的界面和流畅的动画效果。

## 特性

- 响应式设计，完美适配移动端和桌面端
- 支持触摸滑动和键盘控制（方向键和WASD）
- 平滑的动画效果
- 持续的烟花特效
- 分数系统和最高分记录（本地存储）
- 自动保存游戏进度

## 游戏玩法

1. 使用方向键（↑↓←→）或 WASD 键控制方块移动
2. 在移动端可以通过滑动屏幕来控制方块移动
3. 相同数字的方块相撞时会合并成为它们的和
4. 每次移动后会在空白处随机出现一个新的方块（2或4）
5. 当无法移动时游戏结束
6. 点击"重新开始"按钮可以重置游戏

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)
- Canvas Confetti（烟花效果）

## 本地运行

1. 克隆仓库：
```bash
git clone https://github.com/OGS-1-OGS/2048-game.git
```

2. 进入项目目录：
```bash
cd 2048-game
```

3. 使用浏览器打开 `index.html` 文件即可开始游戏

## 在线演示

访问 [GitHub Pages](https://ogs-1-ogs.github.io/2048-game) 体验游戏

## 贡献

欢迎提交 Issue 和 Pull Request

## 许可证

MIT License 