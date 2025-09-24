class TetrisGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        this.canvas.width = this.blockSize * this.cols;
        this.canvas.height = this.blockSize * this.rows;

        this.originalWidth = this.canvas.width;
        this.originalHeight = this.canvas.height;
        this.isFullscreen = false;
        this.fullscreenWrapper = null;

        this.board = [];
        this.currentPiece = null;
        this.gameOver = false;
        this.score = 0;
        this.highScore = localStorage.getItem('tetrisHighScore') || 0;
        this.dropCounter = 0;
        this.lastTime = 0;
        this.dropInterval = 1000;
        this.isPaused = true;

        this.colors = [
            '#FF0D72', '#0DC2FF', '#0DFF72',
            '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'
        ];

        this.pieces = [
            [[1, 1, 1, 1]],
            [[1, 1], [1, 1]],
            [[0, 1, 0], [1, 1, 1]],
            [[1, 0], [1, 0], [1, 1]],
            [[0, 1], [0, 1], [1, 1]],
            [[1, 1, 0], [0, 1, 1]],
            [[0, 1, 1], [1, 1, 0]]
        ];

        this.touchStartX = null;
        this.touchStartY = null;
        this.touchStartTime = null;

        this.init();
    }

    init() {
        this.resetBoard();
        this.setupEventListeners();
        this.updateUI();
        this.draw();
    }

    resetBoard() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) return;

            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                case ' ':
                    this.rotatePiece();
                    break;
            }
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.touchStartTime = Date.now();
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.touchStartX || !this.touchStartY) return;
            if (this.gameOver || this.isPaused) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchDuration = Date.now() - this.touchStartTime;

            const dx = touchEndX - this.touchStartX;
            const dy = touchEndY - this.touchStartY;

            if (touchDuration < 200 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                this.rotatePiece();
            } else if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 30) {
                    this.movePiece(1, 0);
                } else if (dx < -30) {
                    this.movePiece(-1, 0);
                }
            } else {
                if (dy > 30) {
                    this.dropInterval = 50;
                }
            }

            this.touchStartX = null;
            this.touchStartY = null;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('click', () => {
            if (this.isPaused && !this.gameOver) {
                this.start();
            } else if (this.gameOver) {
                this.restart();
            }
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            if (this.isPaused && !this.gameOver) {
                this.start();
            } else if (this.gameOver) {
                this.restart();
            }
        });

        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                this.exitFullscreen();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                this.exitFullscreen();
            }
        });
    }

    start() {
        this.isPaused = false;
        this.spawnPiece();
        this.gameLoop();
        document.getElementById('startBtn').textContent = 'Restart';
        document.getElementById('gameStatus').textContent = 'Playing';
    }

    restart() {
        this.gameOver = false;
        this.isPaused = true;
        this.score = 0;
        this.resetBoard();
        this.currentPiece = null;
        this.dropInterval = 1000;
        this.updateUI();
        this.draw();
        document.getElementById('startBtn').textContent = 'Start';
        document.getElementById('gameStatus').textContent = 'Click to Start';
    }

    spawnPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        const piece = this.pieces[pieceIndex];
        this.currentPiece = {
            shape: piece,
            x: Math.floor((this.cols - piece[0].length) / 2),
            y: 0,
            color: this.colors[pieceIndex]
        };

        if (this.collision(0, 0)) {
            this.gameOver = true;
            this.onGameOver();
        }
    }

    movePiece(dx, dy) {
        if (!this.currentPiece) return;

        if (!this.collision(dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;

            if (dy > 0) {
                this.dropCounter = 0;
            }
        } else if (dy > 0) {
            this.lockPiece();
            this.clearLines();
            this.spawnPiece();
            this.dropInterval = 1000;
        }
    }

    rotatePiece() {
        if (!this.currentPiece) return;

        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );

        const prevShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;

        if (this.collision(0, 0)) {
            this.currentPiece.shape = prevShape;
        }
    }

    collision(dx, dy) {
        if (!this.currentPiece) return false;

        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (!this.currentPiece.shape[y][x]) continue;

                const newX = this.currentPiece.x + x + dx;
                const newY = this.currentPiece.y + y + dy;

                if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                    return true;
                }

                if (newY < 0) continue;

                if (this.board[newY][newX]) {
                    return true;
                }
            }
        }
        return false;
    }

    lockPiece() {
        if (!this.currentPiece) return;

        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (!this.currentPiece.shape[y][x]) continue;

                const boardY = this.currentPiece.y + y;
                const boardX = this.currentPiece.x + x;

                if (boardY >= 0) {
                    this.board[boardY][boardX] = this.currentPiece.color;
                }
            }
        }

        this.score += 10;
        this.updateUI();
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++;
            }
        }

        if (linesCleared > 0) {
            this.score += linesCleared * 100 * linesCleared;
            this.updateUI();
        }
    }

    draw() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }

        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }

        this.ctx.strokeStyle = '#333';
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvas.width, y * this.blockSize);
            this.ctx.stroke();
        }
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.blockSize + 1,
            y * this.blockSize + 1,
            this.blockSize - 2,
            this.blockSize - 2
        );

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(
            x * this.blockSize + 1,
            y * this.blockSize + 1,
            this.blockSize - 2,
            4
        );

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(
            x * this.blockSize + 1,
            y * this.blockSize + this.blockSize - 5,
            this.blockSize - 2,
            4
        );
    }

    gameLoop(time = 0) {
        if (this.gameOver || this.isPaused) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropCounter = 0;
        }

        this.draw();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
    }

    onGameOver() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetrisHighScore', this.highScore);
            this.updateUI();
        }

        document.getElementById('gameStatus').textContent = 'Game Over!';
        document.getElementById('startBtn').textContent = 'Restart';

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);

        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);

        if (this.score === this.highScore && this.score > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText('NEW HIGH SCORE!', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }

    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    enterFullscreen() {
        this.isFullscreen = true;

        // Create fullscreen wrapper
        this.fullscreenWrapper = document.createElement('div');
        this.fullscreenWrapper.className = 'fullscreen-wrapper';

        // Clone and move game info
        const gameInfo = document.querySelector('.game-info').cloneNode(true);
        this.fullscreenWrapper.appendChild(gameInfo);

        // Move canvas to fullscreen wrapper
        const originalParent = this.canvas.parentElement;
        this.canvas.setAttribute('data-original-parent', '');
        this.fullscreenWrapper.appendChild(this.canvas);

        // Create fullscreen controls
        const controls = document.createElement('div');
        controls.className = 'fullscreen-controls';

        const startBtn = document.getElementById('startBtn').cloneNode(true);
        startBtn.id = 'startBtnFullscreen';
        startBtn.addEventListener('click', () => {
            if (this.isPaused && !this.gameOver) {
                this.start();
            } else if (this.gameOver) {
                this.restart();
            }
        });

        const exitBtn = document.createElement('button');
        exitBtn.textContent = '✕ Exit Fullscreen';
        exitBtn.addEventListener('click', () => this.exitFullscreen());

        controls.appendChild(startBtn);
        controls.appendChild(exitBtn);
        this.fullscreenWrapper.appendChild(controls);

        // Add wrapper to body
        document.body.appendChild(this.fullscreenWrapper);

        // Request fullscreen
        if (this.fullscreenWrapper.requestFullscreen) {
            this.fullscreenWrapper.requestFullscreen();
        } else if (this.fullscreenWrapper.webkitRequestFullscreen) {
            this.fullscreenWrapper.webkitRequestFullscreen();
        } else if (this.fullscreenWrapper.msRequestFullscreen) {
            this.fullscreenWrapper.msRequestFullscreen();
        }

        // Scale canvas for fullscreen
        this.resizeCanvasForFullscreen();

        // Update button text
        document.getElementById('fullscreenBtn').textContent = '✕ Exit Fullscreen';
    }

    exitFullscreen() {
        if (!this.isFullscreen) return;

        this.isFullscreen = false;

        // Exit fullscreen mode
        if (document.fullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }

        // Move canvas back to original position
        if (this.fullscreenWrapper) {
            const tetrisContainer = document.querySelector('.tetris-container');
            const gameButtons = tetrisContainer.querySelector('.game-buttons');
            tetrisContainer.insertBefore(this.canvas, gameButtons);

            // Remove fullscreen wrapper
            this.fullscreenWrapper.remove();
            this.fullscreenWrapper = null;
        }

        // Reset canvas size
        this.canvas.width = this.originalWidth;
        this.canvas.height = this.originalHeight;
        this.blockSize = 30;

        // Update button text
        document.getElementById('fullscreenBtn').textContent = '⛶ Fullscreen';

        // Redraw the game
        this.draw();
    }

    resizeCanvasForFullscreen() {
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.8;

        // Calculate scale to fit screen
        const scaleX = maxWidth / this.originalWidth;
        const scaleY = maxHeight / this.originalHeight;
        const scale = Math.min(scaleX, scaleY, 3); // Max 3x scaling

        // Update canvas size
        this.canvas.width = this.originalWidth * scale;
        this.canvas.height = this.originalHeight * scale;
        this.blockSize = 30 * scale;

        // Redraw the game
        this.draw();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new TetrisGame('tetrisCanvas');
});