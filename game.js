/**
 * 2048游戏核心类
 * 实现了2048游戏的所有基本功能，包括：
 * - 游戏初始化
 * - 方块移动和合并
 * - 分数计算
 * - 触摸和键盘控制
 * - 游戏状态管理
 */
class Game2048 {
  /**
   * 构造函数：初始化游戏
   * 设置基本属性并调用初始化方法
   */
  constructor() {
    // 游戏网格大小（4x4）
    this.gridSize = 4;
    // 初始化空网格
    this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
    // 初始化分数
    this.score = 0;
    // 从本地存储获取最高分
    this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
    // 游戏结束标志
    this.gameOver = false;
    // 存储所有方块元素的Map
    this.tiles = new Map();
    // 记录是否已经达到过2048
    this.reached2048 = false;

    // 初始化游戏
    this.initializeDOM();
    this.initializeListeners();
    this.initializeGame();

    // 监听窗口大小变化，重新计算方块位置
    window.addEventListener('resize', () => {
      this.updateAllTilePositions();
    });
  }

  /**
   * 初始化DOM元素
   * 获取游戏所需的所有DOM元素引用
   */
  initializeDOM() {
    this.scoreDisplay = document.getElementById('score');
    this.bestScoreDisplay = document.getElementById('best-score');
    this.tileContainer = document.querySelector('.tile-container');
    this.gameMessage = document.querySelector('.game-message');
    this.retryButton = document.querySelector('.retry-button');

    // 更新最高分显示
    this.bestScoreDisplay.textContent = this.bestScore;
  }

  /**
   * 初始化事件监听器
   * 设置键盘和触摸事件的处理
   */
  initializeListeners() {
    // 键盘控制
    document.addEventListener('keydown', (e) => {
      if (this.gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.move('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.move('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.move('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.move('right');
          break;
      }
    });

    // 触摸控制
    let touchStartX, touchStartY;
    const gameContainer = document.querySelector('.game-container');

    // 记录触摸起始位置
    gameContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    // 防止页面滚动
    gameContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
    });

    // 处理触摸结束，计算滑动方向
    gameContainer.addEventListener('touchend', (e) => {
      if (this.gameOver) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // 确定滑动方向（需要超过最小滑动距离）
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > 30) { // 最小滑动距离
          if (deltaX > 0) {
            this.move('right');
          } else {
            this.move('left');
          }
        }
      } else {
        if (Math.abs(deltaY) > 30) {
          if (deltaY > 0) {
            this.move('down');
          } else {
            this.move('up');
          }
        }
      }
    });

    // 重新开始按钮
    this.retryButton.addEventListener('click', () => {
      this.restart();
    });
  }

  /**
   * 初始化游戏状态
   * 重置网格和分数，添加初始方块
   */
  initializeGame() {
    // 清空网格和分数
    this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.tiles.clear();
    this.tileContainer.innerHTML = '';
    this.scoreDisplay.textContent = '0';
    this.gameMessage.classList.remove('game-over');

    // 添加两个初始方块
    this.addRandomTile();
    this.addRandomTile();
  }

  /**
   * 重新开始游戏
   */
  restart() {
    this.initializeGame();
  }

  /**
   * 在随机空位置添加新方块
   * 90%概率生成2，10%概率生成4
   */
  addRandomTile() {
    const emptyCells = [];
    // 找出所有空单元格
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] === 0) {
          emptyCells.push({ x: i, y: j });
        }
      }
    }

    if (emptyCells.length > 0) {
      // 随机选择一个空单元格
      const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      // 90%概率生成2，10%概率生成4
      const value = Math.random() < 0.9 ? 2 : 4;
      this.grid[x][y] = value;
      this.createTileElement(x, y, value);
    }
  }

  /**
   * 创建新的方块DOM元素
   * @param {number} x - 行索引
   * @param {number} y - 列索引
   * @param {number} value - 方块的值
   */
  createTileElement(x, y, value) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.value = value;
    tile.textContent = value;

    this.tileContainer.appendChild(tile);
    this.tiles.set(`${x},${y}`, tile);

    // 设置初始位置
    this.updateTilePosition(x, y, x, y);
  }

  /**
   * 更新方块位置
   * @param {number} fromX - 起始行索引
   * @param {number} fromY - 起始列索引
   * @param {number} toX - 目标行索引
   * @param {number} toY - 目标列索引
   */
  updateTilePosition(fromX, fromY, toX, toY) {
    const tile = this.tiles.get(`${fromX},${fromY}`);
    if (tile) {
      const position = this.calculateTilePosition(toX, toY);
      tile.style.left = position.left + 'px';
      tile.style.top = position.top + 'px';
      this.tiles.delete(`${fromX},${fromY}`);
      this.tiles.set(`${toX},${toY}`, tile);
    }
  }

  /**
   * 计算方块的实际像素位置
   * @param {number} row - 行索引
   * @param {number} col - 列索引
   * @returns {Object} 包含left和top值的对象
   */
  calculateTilePosition(row, col) {
    const gap = parseInt(getComputedStyle(document.querySelector('.grid-container')).gap) || 15;
    const containerWidth = this.tileContainer.clientWidth;
    const tileSize = (containerWidth - (gap * (this.gridSize - 1))) / this.gridSize;

    return {
      left: col * (tileSize + gap),
      top: row * (tileSize + gap)
    };
  }

  /**
   * 更新所有方块的位置
   * 用于窗口大小改变时重新计算位置
   */
  updateAllTilePositions() {
    this.tiles.forEach((tile, key) => {
      const [x, y] = key.split(',').map(Number);
      const position = this.calculateTilePosition(x, y);
      tile.style.left = position.left + 'px';
      tile.style.top = position.top + 'px';
    });
  }

  /**
   * 移动方块
   * @param {string} direction - 移动方向：'up', 'down', 'left', 'right'
   */
  move(direction) {
    let moved = false;
    const vectors = {
      'up': { x: -1, y: 0 },
      'down': { x: 1, y: 0 },
      'left': { x: 0, y: -1 },
      'right': { x: 0, y: 1 }
    };

    const vector = vectors[direction];
    const traversals = this.buildTraversals(vector);

    // 清除所有合并标记
    this.tiles.forEach(tile => delete tile.merged);

    // 先移动所有方块到最远位置
    let hasMoved = false;
    traversals.x.forEach(x => {
      traversals.y.forEach(y => {
        if (this.grid[x][y] !== 0) {
          const cell = { x, y };
          const next = this.findFarthestPosition(cell, vector);

          if (next.x !== x || next.y !== y) {
            // 移动到最远位置
            this.grid[next.x][next.y] = this.grid[x][y];
            this.grid[x][y] = 0;
            this.updateTilePosition(x, y, next.x, next.y);
            hasMoved = true;
            moved = true;
          }
        }
      });
    });

    // 然后检查和执行合并
    traversals.x.forEach(x => {
      traversals.y.forEach(y => {
        if (this.grid[x][y] !== 0) {
          const nextPos = {
            x: x + vector.x,
            y: y + vector.y
          };

          if (this.withinBounds(nextPos) &&
            this.grid[nextPos.x][nextPos.y] === this.grid[x][y] &&
            !this.tiles.get(`${nextPos.x},${nextPos.y}`).merged &&
            !this.tiles.get(`${x},${y}`).merged) {

            const newValue = this.grid[x][y] * 2;
            this.grid[nextPos.x][nextPos.y] = newValue;
            this.grid[x][y] = 0;

            const targetTile = this.tiles.get(`${nextPos.x},${nextPos.y}`);
            const mergingTile = this.tiles.get(`${x},${y}`);

            targetTile.dataset.value = newValue;
            targetTile.textContent = newValue;
            targetTile.merged = true;

            mergingTile.remove();
            this.tiles.delete(`${x},${y}`);

            this.updateScore(newValue);

            moved = true;
            hasMoved = true;
          }
        }
      });
    });

    if (moved) {
      this.addRandomTile();
      if (this.isGameOver()) {
        this.gameOver = true;
        this.gameMessage.classList.add('game-over');
        this.gameMessage.querySelector('p').textContent = '游戏结束！最终得分：' + this.score;
      }
    }
  }

  /**
   * 构建遍历顺序
   * 确保从正确的方向开始移动方块
   * @param {Object} vector - 移动方向向量
   * @returns {Object} 包含x和y遍历顺序的对象
   */
  buildTraversals(vector) {
    const traversals = {
      x: Array(this.gridSize).fill().map((_, i) => i),
      y: Array(this.gridSize).fill().map((_, i) => i)
    };

    // 确保我们总是从正确的方向遍历
    if (vector.x === 1) traversals.x.reverse();
    if (vector.y === 1) traversals.y.reverse();

    return traversals;
  }

  /**
   * 找到方块可以移动到的最远位置
   * @param {Object} cell - 当前单元格位置
   * @param {Object} vector - 移动方向向量
   * @returns {Object} 最远可达位置
   */
  findFarthestPosition(cell, vector) {
    let previous;
    let next = { x: cell.x, y: cell.y };

    do {
      previous = next;
      next = {
        x: previous.x + vector.x,
        y: previous.y + vector.y
      };
    } while (this.withinBounds(next) && this.grid[next.x][next.y] === 0);

    return previous;
  }

  /**
   * 检查位置是否在网格范围内
   * @param {Object} position - 要检查的位置
   * @returns {boolean} 是否在范围内
   */
  withinBounds(position) {
    return position.x >= 0 && position.x < this.gridSize &&
      position.y >= 0 && position.y < this.gridSize;
  }

  /**
   * 检查游戏是否结束
   * 当没有空格且没有可合并的相邻方块时，游戏结束
   * @returns {boolean} 游戏是否结束
   */
  isGameOver() {
    // 检查是否还有空格
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] === 0) return false;
      }
    }

    // 检查是否还有可以合并的相邻方块
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const currentValue = this.grid[i][j];
        // 检查右侧
        if (j < this.gridSize - 1 && this.grid[i][j + 1] === currentValue) return false;
        // 检查下方
        if (i < this.gridSize - 1 && this.grid[i + 1][j] === currentValue) return false;
      }
    }

    // 如果没有空格且没有可合并的方块，游戏结束
    this.gameOver = true;
    this.gameMessage.classList.add('game-over');
    return true;
  }

  // 更新分数
  updateScore(value) {
    this.score += value;
    this.scoreDisplay.textContent = this.score;

    // 更新最高分
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.bestScoreDisplay.textContent = this.bestScore;
      localStorage.setItem('bestScore', this.bestScore);
    }
  }
}

// 当DOM加载完成后启动游戏
document.addEventListener('DOMContentLoaded', () => {
  new Game2048();
}); 