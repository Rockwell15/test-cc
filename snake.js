const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('snakeScore');
const highScoreElement = document.getElementById('snakeHighScore');
const statusElement = document.getElementById('snakeGameStatus');
const startBtn = document.getElementById('snakeStartBtn');
const fullscreenBtn = document.getElementById('snakeFullscreenBtn');

// Game constants
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

// Game state
let snake = [];
let food = {};
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gameLoop = null;
let speed = 100; // milliseconds per frame

// Initialize high score display
highScoreElement.textContent = highScore;

// Initialize snake
function initSnake() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = 100;
    scoreElement.textContent = score;
    spawnFood();
}

// Spawn food at random location
function spawnFood() {
    let validPosition = false;
    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE))
        };
        // Check if food spawns on snake
        validPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CANVAS_SIZE / GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE);
        ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#4ade80' : '#22c55e';
        ctx.fillRect(
            segment.x * GRID_SIZE + 1,
            segment.y * GRID_SIZE + 1,
            GRID_SIZE - 2,
            GRID_SIZE - 2
        );

        // Draw eyes on head
        if (index === 0) {
            ctx.fillStyle = '#1a1a1a';
            const eyeSize = 3;
            const eyeOffset = 5;

            if (direction.x === 1) { // Moving right
                ctx.fillRect(segment.x * GRID_SIZE + GRID_SIZE - eyeOffset, segment.y * GRID_SIZE + 4, eyeSize, eyeSize);
                ctx.fillRect(segment.x * GRID_SIZE + GRID_SIZE - eyeOffset, segment.y * GRID_SIZE + GRID_SIZE - 7, eyeSize, eyeSize);
            } else if (direction.x === -1) { // Moving left
                ctx.fillRect(segment.x * GRID_SIZE + 2, segment.y * GRID_SIZE + 4, eyeSize, eyeSize);
                ctx.fillRect(segment.x * GRID_SIZE + 2, segment.y * GRID_SIZE + GRID_SIZE - 7, eyeSize, eyeSize);
            } else if (direction.y === -1) { // Moving up
                ctx.fillRect(segment.x * GRID_SIZE + 4, segment.y * GRID_SIZE + 2, eyeSize, eyeSize);
                ctx.fillRect(segment.x * GRID_SIZE + GRID_SIZE - 7, segment.y * GRID_SIZE + 2, eyeSize, eyeSize);
            } else if (direction.y === 1) { // Moving down
                ctx.fillRect(segment.x * GRID_SIZE + 4, segment.y * GRID_SIZE + GRID_SIZE - eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(segment.x * GRID_SIZE + GRID_SIZE - 7, segment.y * GRID_SIZE + GRID_SIZE - eyeOffset, eyeSize, eyeSize);
            }
        }
    });

    // Draw food
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// Update game state
function update() {
    if (!gameRunning) return;

    // Update direction
    direction = { ...nextDirection };

    // Calculate new head position
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // Check wall collision
    if (head.x < 0 || head.x >= CANVAS_SIZE / GRID_SIZE ||
        head.y < 0 || head.y >= CANVAS_SIZE / GRID_SIZE) {
        gameOver();
        return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        spawnFood();

        // Increase speed slightly
        speed = Math.max(50, speed - 2);
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, speed);
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }

    draw();
}

// Game step
function gameStep() {
    update();
}

// Start game
function startGame() {
    if (gameRunning) {
        pauseGame();
        return;
    }

    if (snake.length === 0 || score === 0) {
        initSnake();
    }

    gameRunning = true;
    statusElement.textContent = 'Playing';
    startBtn.textContent = 'Pause';
    gameLoop = setInterval(gameStep, speed);
}

// Pause game
function pauseGame() {
    gameRunning = false;
    statusElement.textContent = 'Paused';
    startBtn.textContent = 'Resume';
    clearInterval(gameLoop);
}

// Game over
function gameOver() {
    gameRunning = false;
    statusElement.textContent = 'Game Over!';
    startBtn.textContent = 'Start';
    clearInterval(gameLoop);

    // Update high score
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }

    snake = [];
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction.y === 0) nextDirection = { x: 0, y: -1 };
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction.y === 0) nextDirection = { x: 0, y: 1 };
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction.x === 0) nextDirection = { x: -1, y: 0 };
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction.x === 0) nextDirection = { x: 1, y: 0 };
            e.preventDefault();
            break;
    }
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (!gameRunning) return;
    e.preventDefault();

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine swipe direction
    if (absDeltaX > absDeltaY && absDeltaX > 30) {
        // Horizontal swipe
        if (deltaX > 0 && direction.x === 0) {
            nextDirection = { x: 1, y: 0 };
        } else if (deltaX < 0 && direction.x === 0) {
            nextDirection = { x: -1, y: 0 };
        }
    } else if (absDeltaY > absDeltaX && absDeltaY > 30) {
        // Vertical swipe
        if (deltaY > 0 && direction.y === 0) {
            nextDirection = { x: 0, y: 1 };
        } else if (deltaY < 0 && direction.y === 0) {
            nextDirection = { x: 0, y: -1 };
        }
    }
}, { passive: false });

// Button event listeners
startBtn.addEventListener('click', startGame);

// Fullscreen functionality
fullscreenBtn.addEventListener('click', () => {
    const container = document.querySelector('.snake-container');

    if (!document.fullscreenElement) {
        // Enter fullscreen
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }
        container.classList.add('fullscreen-wrapper');

        // Scale canvas for fullscreen
        const scale = Math.min(window.innerHeight * 0.8 / CANVAS_SIZE, window.innerWidth * 0.9 / CANVAS_SIZE);
        canvas.style.width = (CANVAS_SIZE * scale) + 'px';
        canvas.style.height = (CANVAS_SIZE * scale) + 'px';
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        container.classList.remove('fullscreen-wrapper');
        canvas.style.width = CANVAS_SIZE + 'px';
        canvas.style.height = CANVAS_SIZE + 'px';
    }
});

// Handle fullscreen change
document.addEventListener('fullscreenchange', () => {
    const container = document.querySelector('.snake-container');
    if (!document.fullscreenElement) {
        container.classList.remove('fullscreen-wrapper');
        canvas.style.width = CANVAS_SIZE + 'px';
        canvas.style.height = CANVAS_SIZE + 'px';
    }
});

// Initialize game display
initSnake();
draw();
