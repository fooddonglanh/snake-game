/* =========================================
   SNAKE GAME — Canvas-based game logic
   ========================================= */

const SnakeGame = (() => {
    // --- Config ---
    const CELL_SIZE = 20;
    const GRID_W = 20;
    const GRID_H = 20;
    const CANVAS_W = CELL_SIZE * GRID_W;
    const CANVAS_H = CELL_SIZE * GRID_H;
    const INITIAL_SPEED = 150; // ms per tick
    const SPEED_INCREMENT = 2; // ms faster per food eaten
    const MIN_SPEED = 60;

    // --- Colors ---
    const COLORS = {
        bg: '#0a0e1a',
        grid: 'rgba(255,255,255,0.02)',
        snakeHead: '#22d3ee',
        snakeBody: '#06b6d4',
        snakeGlow: 'rgba(6,182,212,0.5)',
        food: '#e879f9',
        foodGlow: 'rgba(217,70,239,0.6)',
        foodInner: '#d946ef',
    };

    // --- State ---
    let canvas, ctx;
    let snake, food, direction, nextDirection;
    let score, highScore, speed;
    let gameLoop = null;
    let isRunning = false;
    let isPaused = false;
    let startTime = null;
    let elapsedSeconds = 0;
    let timerInterval = null;
    let particles = [];
    let animFrameId = null;
    let snakeHeadImg = new Image();
    let appleImg = new Image();
    let imagesLoaded = 0;
    const totalImages = 2;

    function _loadAssets() {
        const onImgLoad = () => {
            imagesLoaded++;
            console.log(`Image loaded: ${imagesLoaded}/${totalImages}`);
        };

        const onImgError = (e) => {
            console.error("Failed to load image", e.target.src);
        };

        snakeHeadImg.onload = onImgLoad;
        appleImg.onload = onImgLoad;
        snakeHeadImg.onerror = onImgError;
        appleImg.onerror = onImgError;

        snakeHeadImg.src = 'assets/snake_head.png';
        appleImg.src = 'assets/apple.png';
    }

    // Callbacks
    let onScoreUpdate = null;
    let onGameOver = null;
    let onTimeUpdate = null;

    function init(canvasEl, callbacks = {}) {
        canvas = canvasEl;
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
        ctx = canvas.getContext('2d');
        onScoreUpdate = callbacks.onScoreUpdate || null;
        onGameOver = callbacks.onGameOver || null;
        onTimeUpdate = callbacks.onTimeUpdate || null;
        highScore = parseInt(localStorage.getItem('snake_highscore') || '0', 10);
        _loadAssets();
        _drawIdle();
        _startAnimLoop();
    }

    function start() {
        snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 },
        ];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        score = 0;
        speed = INITIAL_SPEED;
        isRunning = true;
        isPaused = false;
        elapsedSeconds = 0;
        startTime = Date.now();

        _spawnFood();
        _updateScore();
        _startTimer();

        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(_tick, speed);
    }

    function pause() {
        if (!isRunning) return;
        isPaused = !isPaused;
        if (isPaused) {
            clearInterval(gameLoop);
            clearInterval(timerInterval);
            gameLoop = null;
        } else {
            startTime = Date.now() - elapsedSeconds * 1000;
            gameLoop = setInterval(_tick, speed);
            _startTimer();
        }
    }

    function setDirection(dir) {
        if (!isRunning || isPaused) return;
        const map = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 },
        };
        const d = map[dir];
        if (!d) return;
        // Prevent 180-degree turn
        if (d.x === -direction.x && d.y === -direction.y) return;
        nextDirection = d;
    }

    function getState() {
        return { isRunning, isPaused, score, highScore, elapsedSeconds };
    }

    // --- Internal ---

    function _tick() {
        _updateParticles();
        direction = { ...nextDirection };
        const head = {
            x: snake[0].x + direction.x,
            y: snake[0].y + direction.y
        };

        // Wall collision
        if (head.x < 0 || head.x >= GRID_W || head.y < 0 || head.y >= GRID_H) {
            _endGame();
            return;
        }

        // Self collision
        if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            _endGame();
            return;
        }

        snake.unshift(head);

        // Eat food
        if (head.x === food.x && head.y === food.y) {
            _spawnParticles(food.x, food.y);
            score += 10;
            _updateScore();
            _spawnFood();
            // Speed up
            speed = Math.max(MIN_SPEED, speed - SPEED_INCREMENT);
            clearInterval(gameLoop);
            gameLoop = setInterval(_tick, speed);
        } else {
            snake.pop();
        }

        _draw();
    }

    function _spawnFood() {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * GRID_W),
                y: Math.floor(Math.random() * GRID_H)
            };
        } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
        food = pos;
    }

    function _updateScore() {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snake_highscore', highScore.toString());
        }
        if (onScoreUpdate) onScoreUpdate(score, highScore);
    }

    function _startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            if (onTimeUpdate) onTimeUpdate(elapsedSeconds);
        }, 1000);
    }

    function _endGame() {
        isRunning = false;
        clearInterval(gameLoop);
        clearInterval(timerInterval);
        gameLoop = null;
        _draw();
        if (onGameOver) onGameOver(score, elapsedSeconds);
    }

    function _draw() {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        // Background
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Grid
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= GRID_W; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE, 0);
            ctx.lineTo(x * CELL_SIZE, CANVAS_H);
            ctx.stroke();
        }
        for (let y = 0; y <= GRID_H; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CELL_SIZE);
            ctx.lineTo(CANVAS_W, y * CELL_SIZE);
            ctx.stroke();
        }

        // Food (Apple)
        ctx.save();
        if (imagesLoaded >= totalImages) {
            ctx.drawImage(
                appleImg,
                food.x * CELL_SIZE,
                food.y * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE
            );
        } else {
            // Fallback to original food drawing if images not loaded
            ctx.shadowColor = COLORS.foodGlow;
            ctx.shadowBlur = 18;
            ctx.fillStyle = COLORS.food;
            ctx.beginPath();
            ctx.arc(
                food.x * CELL_SIZE + CELL_SIZE / 2,
                food.y * CELL_SIZE + CELL_SIZE / 2,
                CELL_SIZE / 2 - 2,
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = COLORS.foodInner;
            ctx.beginPath();
            ctx.arc(
                food.x * CELL_SIZE + CELL_SIZE / 2,
                food.y * CELL_SIZE + CELL_SIZE / 2,
                CELL_SIZE / 4,
                0, Math.PI * 2
            );
            ctx.fill();
        }
        ctx.restore();

        // Snake
        snake.forEach((seg, i) => {
            const x = seg.x * CELL_SIZE;
            const y = seg.y * CELL_SIZE;
            const isHead = i === 0;
            const r = 3;
            const pad = 1;

            ctx.save();
            if (isHead) {
                if (imagesLoaded >= totalImages) {
                    // Draw rotated head
                    const centerX = x + CELL_SIZE / 2;
                    const centerY = y + CELL_SIZE / 2;
                    let angle = 0;
                    if (direction.x === 1) angle = 0;
                    else if (direction.x === -1) angle = Math.PI;
                    else if (direction.y === 1) angle = Math.PI / 2;
                    else if (direction.y === -1) angle = -Math.PI / 2;

                    ctx.translate(centerX, centerY);
                    ctx.rotate(angle);
                    ctx.drawImage(snakeHeadImg, -CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
                } else {
                    ctx.shadowColor = COLORS.snakeGlow;
                    ctx.shadowBlur = 14;
                    ctx.fillStyle = COLORS.snakeHead;
                    ctx.beginPath();
                    ctx.roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, r);
                    ctx.fill();
                }
            } else {
                const alpha = 1 - (i / snake.length) * 0.55;
                ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
                // Rounded rect for body
                ctx.beginPath();
                ctx.roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, r);
                ctx.fill();
            }
            ctx.restore();
        });

        // Particles
        _drawParticles();
    }

    function _drawIdle() {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Grid
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= GRID_W; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE, 0);
            ctx.lineTo(x * CELL_SIZE, CANVAS_H);
            ctx.stroke();
        }
        for (let y = 0; y <= GRID_H; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CELL_SIZE);
            ctx.lineTo(CANVAS_W, y * CELL_SIZE);
            ctx.stroke();
        }

        // Center text
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.font = '600 16px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('Nhấn "Bắt đầu" để chơi', CANVAS_W / 2, CANVAS_H / 2);
    }

    // --- Particle System ---

    function _spawnParticles(gridX, gridY) {
        const cx = gridX * CELL_SIZE + CELL_SIZE / 2;
        const cy = gridY * CELL_SIZE + CELL_SIZE / 2;
        const count = 14;
        const colors = ['#e879f9', '#d946ef', '#22d3ee', '#f0abfc', '#a78bfa', '#fbbf24'];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.6;
            const speed = 1.5 + Math.random() * 3;
            particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.025,
                size: 2.5 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    function _updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life -= p.decay;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function _drawParticles() {
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8 * p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    function _startAnimLoop() {
        function loop() {
            _updateParticles();
            if (particles.length > 0 && !isRunning) {
                _draw();
            }
            animFrameId = requestAnimationFrame(loop);
        }
        if (!animFrameId) animFrameId = requestAnimationFrame(loop);
    }

    return { init, start, pause, setDirection, getState };
})();
