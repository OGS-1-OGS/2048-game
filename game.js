class Game2048 {
  constructor() {
    this.gridSize = 4;
    this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
    this.gameOver = false;
    this.tiles = new Map(); // 存储所有的tile元素

    this.initializeDOM();
    this.initializeListeners();
    this.initializeGame();

    // 在窗口大小改变时重新计算方块位置
    window.addEventListener('resize', () => {
      this.updateAllTilePositions();
    });
  }

  initializeDOM() {
    this.scoreDisplay = document.getElementById('score');
    this.bestScoreDisplay = document.getElementById('best-score');
    this.tileContainer = document.querySelector('.tile-container');
    this.gameMessage = document.querySelector('.game-message');
    this.retryButton = document.querySelector('.retry-button');

    // 更新最高分显示
    this.bestScoreDisplay.textContent = this.bestScore;
  }

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

    gameContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    gameContainer.addEventListener('touchmove', (e) => {
      e.preventDefault(); // 防止页面滚动
    });

    gameContainer.addEventListener('touchend', (e) => {
      if (this.gameOver) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // 确定滑动方向
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

  initializeGame() {
    // 清空网格和分数
    this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.tiles.clear();
    this.tileContainer.innerHTML = '';
    this.scoreDisplay.textContent = '0';
    this.gameMessage.classList.remove('game-over');

    // 添加初始方块
    this.addRandomTile();
    this.addRandomTile();
  }

  restart() {
    this.initializeGame();
  }

  addRandomTile() {
    const emptyCells = [];
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] === 0) {
          emptyCells.push({ x: i, y: j });
        }
      }
    }

    if (emptyCells.length > 0) {
      const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const value = Math.random() < 0.9 ? 2 : 4;
      this.grid[x][y] = value;
      this.createTileElement(x, y, value);
    }
  }

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

  calculateTilePosition(row, col) {
    const gap = parseInt(getComputedStyle(document.querySelector('.grid-container')).gap) || 15;
    const containerWidth = this.tileContainer.clientWidth;
    const tileSize = (containerWidth - (gap * (this.gridSize - 1))) / this.gridSize;

    return {
      left: col * (tileSize + gap),
      top: row * (tileSize + gap)
    };
  }

  updateAllTilePositions() {
    this.tiles.forEach((tile, key) => {
      const [x, y] = key.split(',').map(Number);
      const position = this.calculateTilePosition(x, y);
      tile.style.left = position.left + 'px';
      tile.style.top = position.top + 'px';
    });
  }

  mergeTiles(tile1, tile2) {
    const newValue = parseInt(tile1.dataset.value) * 2;
    tile2.dataset.value = newValue;
    tile2.textContent = newValue;
    tile1.remove();

    // 更新分数
    this.score += newValue;
    this.scoreDisplay.textContent = this.score;

    // 更新最高分
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.bestScoreDisplay.textContent = this.bestScore;
      localStorage.setItem('bestScore', this.bestScore);
    }
  }

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

          // 检查是否可以合并
          if (this.withinBounds(nextPos) &&
            this.grid[nextPos.x][nextPos.y] === this.grid[x][y] &&
            !this.tiles.get(`${nextPos.x},${nextPos.y}`).merged &&
            !this.tiles.get(`${x},${y}`).merged) {

            // 执行合并
            const newValue = this.grid[x][y] * 2;
            this.grid[nextPos.x][nextPos.y] = newValue;
            this.grid[x][y] = 0;

            const targetTile = this.tiles.get(`${nextPos.x},${nextPos.y}`);
            const mergingTile = this.tiles.get(`${x},${y}`);

            // 更新目标方块的值
            targetTile.dataset.value = newValue;
            targetTile.textContent = newValue;
            targetTile.merged = true;

            // 移除被合并的方块
            mergingTile.remove();
            this.tiles.delete(`${x},${y}`);

            // 更新分数
            this.score += newValue;
            this.scoreDisplay.textContent = this.score;

            // 更新最高分
            if (this.score > this.bestScore) {
              this.bestScore = this.score;
              this.bestScoreDisplay.textContent = this.bestScore;
              localStorage.setItem('bestScore', this.bestScore);
            }

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

  withinBounds(position) {
    return position.x >= 0 && position.x < this.gridSize &&
      position.y >= 0 && position.y < this.gridSize;
  }

  isGameOver() {
    // 检查是否还有空格
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        if (this.grid[x][y] === 0) return false;

        // 检查相邻格子是否可以合并
        const directions = [{ x: 0, y: 1 }, { x: 1, y: 0 }];
        for (let dir of directions) {
          const newX = x + dir.x;
          const newY = y + dir.y;
          if (this.withinBounds({ x: newX, y: newY }) &&
            this.grid[x][y] === this.grid[newX][newY]) {
            return false;
          }
        }
      }
    }
    return true;
  }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
  new Game2048();
}); 