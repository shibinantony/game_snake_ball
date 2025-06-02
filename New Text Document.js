// --- Game Constants ---
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_GAME_SPEED = 200; // Milliseconds
const SCORE_THRESHOLD = 100;
const BONUS_POINTS_PER_FROG = 50;
const INITIAL_POINTS_PER_FROG = 10;
const SPEED_MULTIPLIER = 1.5; // Factor to increase speed (decrease interval)

// --- Class Definitions ---

class Board {
    constructor(gridSize, cellSize, boardElementId) {
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.boardElement = document.getElementById(boardElementId);

        if (!this.boardElement) {
            console.error(`Board element with ID '${boardElementId}' not found.`);
            // Potentially throw an error or handle this case to prevent further issues
            return;
        }
        this.setupBoard();
    }

    setupBoard() {
        this.boardElement.style.width = `${this.gridSize * this.cellSize}px`;
        this.boardElement.style.height = `${this.gridSize * this.cellSize}px`;
        this.boardElement.style.gridTemplateColumns = `repeat(${this.gridSize}, ${this.cellSize}px)`;
        this.boardElement.style.gridTemplateRows = `repeat(${this.gridSize}, ${this.cellSize}px)`;
    }

    clear() {
        this.boardElement.innerHTML = '';
    }

    drawElement(position, className) {
        const element = document.createElement('div');
        element.style.gridColumnStart = position.x + 1;
        element.style.gridRowStart = position.y + 1;
        // Ensure game cells have a defined size, even if not in CSS for .game-cell
        element.style.width = `${this.cellSize}px`;
        element.style.height = `${this.cellSize}px`;
        element.classList.add('game-cell', className);
        this.boardElement.appendChild(element);
    }
}

class Snake {
    constructor(initialPosition, initialDirection, gridSize) {
        this.gridSize = gridSize;
        this.initialPosition = initialPosition;
        this.initialDirection = initialDirection;
        this.reset();
    }

    reset() {
        this.body = [{ ...this.initialPosition }];
        this.direction = { ...this.initialDirection };
        this.changingDirection = false; // Prevents multiple direction changes in one game tick
    }

    move() {
        this.changingDirection = false; // Reset for the next game tick
        const head = { x: this.body[0].x + this.direction.x, y: this.body[0].y + this.direction.y };
        this.body.unshift(head); // Add new head
    }

    grow() {
        // Growth happens by not removing the tail segment.
        // The new head segment is already added by the move() method.
    }

    shrink() {
        this.body.pop(); // Remove tail segment
    }

    changeDirection(newDirectionKeyCode, isGameOver) {
        // Do not change direction if game is over or if a change has already been registered for the current tick
        if ((this.changingDirection && !isGameOver)) return false;

        const LEFT_ARROW = 37;
        const UP_ARROW = 38;
        const RIGHT_ARROW = 39;
        const DOWN_ARROW = 40;

        const goingUp = this.direction.y === -1;
        const goingDown = this.direction.y === 1;
        const goingLeft = this.direction.x === -1;
        const goingRight = this.direction.x === 1;

        let attemptedChange = false;
        if (newDirectionKeyCode === LEFT_ARROW && !goingRight) {
            this.direction = { x: -1, y: 0 };
            attemptedChange = true;
        } else if (newDirectionKeyCode === UP_ARROW && !goingDown) {
            this.direction = { x: 0, y: -1 };
            attemptedChange = true;
        } else if (newDirectionKeyCode === RIGHT_ARROW && !goingLeft) {
            this.direction = { x: 1, y: 0 };
            attemptedChange = true;
        } else if (newDirectionKeyCode === DOWN_ARROW && !goingUp) {
            this.direction = { x: 0, y: 1 };
            attemptedChange = true;
        }

        if (attemptedChange && !isGameOver) {
            this.changingDirection = true;
        }
        return attemptedChange; // Indicates if a valid direction change was made
    }

    getHead() {
        return this.body[0];
    }

    getBody() {
        return this.body;
    }

    checkSelfCollision() {
        const head = this.getHead();
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }
        return false;
    }

    checkWallCollision() {
        const head = this.getHead();
        return head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize;
    }
}

class Frog {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.position = { x: 0, y: 0 }; // Initial dummy position
    }

    generatePosition(snakeBody) {
        while (true) {
            this.position = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };

            let collisionWithSnake = false;
            for (let i = 0; i < snakeBody.length; i++) {
                if (this.position.x === snakeBody[i].x && this.position.y === snakeBody[i].y) {
                    collisionWithSnake = true;
                    break;
                }
            }
            if (!collisionWithSnake) {
                break; // Found a valid spot
            }
        }
    }

    getPosition() {
        return this.position;
    }
}

class UIManager {
    constructor(scoreElementId, gameOverElementId) {
        this.scoreDisplay = document.getElementById(scoreElementId);
        this.gameOverDisplay = document.getElementById(gameOverElementId);

        if (!this.scoreDisplay) {
            console.error(`UI element for score (ID: '${scoreElementId}') not found.`);
        }
        if (!this.gameOverDisplay) {
            console.error(`UI element for game over (ID: '${gameOverElementId}') not found.`);
        }
    }

    updateScore(score) {
        if (this.scoreDisplay) this.scoreDisplay.textContent = `Score: ${score}`;
    }

    showGameOver() {
        if (this.gameOverDisplay) this.gameOverDisplay.style.display = 'block';
    }

    hideGameOver() {
        if (this.gameOverDisplay) this.gameOverDisplay.style.display = 'none';
    }
}

class Game {
    constructor(gridSize, cellSize) {
        this.gridSize = gridSize;
        this.cellSize = cellSize;

        // Wait for the DOM to be fully loaded before initializing components that interact with it.
        document.addEventListener('DOMContentLoaded', () => {
            this.board = new Board(gridSize, cellSize, 'game-board');
            // Ensure board was successfully initialized
            if (!this.board.boardElement) {
                 console.error("Game cannot start: Board element could not be initialized.");
                 return;
            }

            this.snake = new Snake(
                { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) }, // Initial position (center)
                { x: 0, y: -1 }, // Initial direction (up)
                gridSize
            );
            this.frog = new Frog(gridSize);
            this.uiManager = new UIManager('score', 'game-over');

            this.score = 0;
            this.gameInterval = null;
            this.currentGameSpeed = INITIAL_GAME_SPEED;
            this.isGameOver = false;
            this.pointsPerFrog = INITIAL_POINTS_PER_FROG;
            this.speedIncreased = false;

            document.addEventListener('keydown', this.handleInput.bind(this));
            this.startGame();
        });
    }

    handleInput(event) {
        const keyPressed = event.keyCode;
        if (this.isGameOver) {
            // Allow restart on arrow key press if game is over
            if (keyPressed >= 37 && keyPressed <= 40) { // Arrow keys
                this.restartGame();
            }
        } else {
            // Pass game over state to prevent direction change locking during game over
            this.snake.changeDirection(keyPressed, this.isGameOver);
        }
    }

    startGame() {
        this.isGameOver = false;
        this.uiManager.hideGameOver();
        this.score = 0;
        this.uiManager.updateScore(this.score);
        this.snake.reset(); // Reset snake to its initial state
        this.currentGameSpeed = INITIAL_GAME_SPEED;
        this.pointsPerFrog = INITIAL_POINTS_PER_FROG;
        this.speedIncreased = false;

        this.frog.generatePosition(this.snake.getBody());
        this.draw();

        clearInterval(this.gameInterval); // Clear any existing game loop
        this.gameInterval = setInterval(() => this.gameLoop(), this.currentGameSpeed);
    }

    gameLoop() {
        if (this.isGameOver) return;

        this.snake.move();

        if (this.checkFrogEaten()) {
            this.score += this.pointsPerFrog;
            this.uiManager.updateScore(this.score);
            this.snake.grow(); // Signal that snake should grow (achieved by not shrinking)
            this.frog.generatePosition(this.snake.getBody());
            this.checkAndApplyBonus();
        } else {
            this.snake.shrink(); // Remove tail if no frog was eaten
        }

        if (this.checkCollisions()) {
            this.endGame();
        } else if (!this.isGameOver) { // Only redraw if the game is still active
            this.draw();
        }
    }

    checkFrogEaten() {
        const snakeHead = this.snake.getHead();
        const frogPos = this.frog.getPosition();
        return snakeHead.x === frogPos.x && snakeHead.y === frogPos.y;
    }

    checkAndApplyBonus() {
        if (this.score >= SCORE_THRESHOLD && !this.speedIncreased) {
            this.pointsPerFrog = BONUS_POINTS_PER_FROG;
            // Calculate new speed: interval decreases, so divide by multiplier. Ensure a minimum speed.
            this.currentGameSpeed = Math.max(50, INITIAL_GAME_SPEED / SPEED_MULTIPLIER); // e.g., 50ms is a fast update
            this.speedIncreased = true;

            clearInterval(this.gameInterval); // Clear old interval
            this.gameInterval = setInterval(() => this.gameLoop(), this.currentGameSpeed); // Start new interval with new speed
            console.log(`Speed increased to ${this.currentGameSpeed}ms interval. Points per frog: ${this.pointsPerFrog}.`);
        }
    }

    checkCollisions() {
        // Check for wall collision or self-collision
        if (this.snake.checkWallCollision() || this.snake.checkSelfCollision()) {
            return true;
        }
        return false;
    }

    draw() {
        this.board.clear();
        // Draw Snake
        this.snake.getBody().forEach(segment => {
            this.board.drawElement(segment, 'snake');
        });
        // Draw Frog
        this.board.drawElement(this.frog.getPosition(), 'frog');
    }

    endGame() {
        clearInterval(this.gameInterval);
        this.isGameOver = true;
        this.uiManager.showGameOver();
    }

    restartGame() {
        // Optional: Add a small delay before restarting to prevent accidental immediate restarts
        // setTimeout(() => this.startGame(), 100);
        this.startGame();
    }
}

// --- Game Initialization ---
// The Game constructor now uses DOMContentLoaded, so we can instantiate it directly.
const snakeGame = new Game(GRID_SIZE, CELL_SIZE);