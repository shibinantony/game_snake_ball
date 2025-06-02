// --- Game Constants ---
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_GAME_SPEED = 200; // Milliseconds
const SCORE_THRESHOLD = 100;
const BONUS_POINTS_PER_FROG = 50;
const INITIAL_POINTS_PER_FROG = 10;
const SPEED_MULTIPLIER = 1.5; // Factor to increase speed (decrease interval)

// --- Function to Inject CSS ---
function injectCSS() {
    const cssStyles = `
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #222;
            margin: 0;
            font-family: sans-serif;
            overflow: hidden; /* Prevent scrollbars if game board is large */
        }
        #game-container {
            text-align: center;
        }
        #game-board {
            display: grid;
            border: 5px solid #fff;
            background-color: #000;
            margin-bottom: 20px;
            box-sizing: content-box; /* Ensure border adds to size, not shrinks content */
        }
        .game-cell {
            /* width and height will be set by JavaScript by the Board class */
        }
        .snake {
            background-color: #0f0; /* Green for the snake */
        }
        .frog {
            background-color: #f00; /* Red for the frog */
            border-radius: 50%; /* Make the frog round */
        }
        #score {
            color: #fff;
            font-size: 1.5em;
            margin-bottom: 10px;
        }
        #game-over {
            color: #fff;
            font-size: 2em;
            display: none; /* Hidden by default */
            margin-top: 20px;
        }
    `;
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = cssStyles;
    document.head.appendChild(styleElement);
}

// --- Function to Create HTML Structure ---
function createHTMLStructure() {
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';

    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score';
    scoreDisplay.textContent = 'Score: 0'; // Initial text

    const gameBoard = document.createElement('div');
    gameBoard.id = 'game-board';

    const gameOverDisplay = document.createElement('div');
    gameOverDisplay.id = 'game-over';
    gameOverDisplay.textContent = 'Game Over! Press any arrow key to restart.';
    gameOverDisplay.style.display = 'none'; // Set initial display style

    gameContainer.appendChild(scoreDisplay);
    gameContainer.appendChild(gameBoard);
    gameContainer.appendChild(gameOverDisplay);

    document.body.appendChild(gameContainer);
}

// --- Class Definitions (Board, Snake, Frog, UIManager, Game) ---
// (Your existing class definitions go here, unchanged)
class Board {
    constructor(gridSize, cellSize, boardElementId) {
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.boardElement = document.getElementById(boardElementId);

        if (!this.boardElement) {
            console.error(`Board element with ID '${boardElementId}' not found.`);
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
        this.changingDirection = false;
    }

    move() {
        this.changingDirection = false;
        const head = { x: this.body[0].x + this.direction.x, y: this.body[0].y + this.direction.y };
        this.body.unshift(head);
    }

    grow() {
        // Growth is handled by not calling shrink()
    }

    shrink() {
        this.body.pop();
    }

    changeDirection(newDirectionKeyCode, isGameOver) {
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
        return attemptedChange;
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
        this.position = { x: 0, y: 0 };
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
                break;
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

        // The DOMContentLoaded listener here will now execute after the main script
        // has already set up the HTML structure and CSS.
        document.addEventListener('DOMContentLoaded', () => {
            // It's important that injectCSS() and createHTMLStructure() from the main script
            // have already run by the time this DOMContentLoaded callback fires.
            // Or, if they are also inside a DOMContentLoaded, ensure proper sequencing.
            // For simplicity with this new structure, we'll call them *before* new Game().

            this.board = new Board(gridSize, cellSize, 'game-board');
            if (!this.board.boardElement) {
                 console.error("Game cannot start: Board element could not be initialized by Game class.");
                 return;
            }

            this.snake = new Snake(
                { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
                { x: 0, y: -1 },
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
            if (keyPressed >= 37 && keyPressed <= 40) {
                this.restartGame();
            }
        } else {
            this.snake.changeDirection(keyPressed, this.isGameOver);
        }
    }

    startGame() {
        this.isGameOver = false;
        this.uiManager.hideGameOver();
        this.score = 0;
        this.uiManager.updateScore(this.score);
        this.snake.reset();
        this.currentGameSpeed = INITIAL_GAME_SPEED;
        this.pointsPerFrog = INITIAL_POINTS_PER_FROG;
        this.speedIncreased = false;

        this.frog.generatePosition(this.snake.getBody());
        this.draw();

        clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), this.currentGameSpeed);
    }

    gameLoop() {
        if (this.isGameOver) return;
        this.snake.move();
        if (this.checkFrogEaten()) {
            this.score += this.pointsPerFrog;
            this.uiManager.updateScore(this.score);
            this.snake.grow();
            this.frog.generatePosition(this.snake.getBody());
            this.checkAndApplyBonus();
        } else {
            this.snake.shrink();
        }
        if (this.checkCollisions()) {
            this.endGame();
        } else if (!this.isGameOver) {
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
            this.currentGameSpeed = Math.max(50, INITIAL_GAME_SPEED / SPEED_MULTIPLIER);
            this.speedIncreased = true;
            clearInterval(this.gameInterval);
            this.gameInterval = setInterval(() => this.gameLoop(), this.currentGameSpeed);
            console.log(`Speed increased to ${this.currentGameSpeed}ms interval. Points per frog: ${this.pointsPerFrog}.`);
        }
    }

    checkCollisions() {
        return this.snake.checkWallCollision() || this.snake.checkSelfCollision();
    }

    draw() {
        if (!this.board || !this.board.boardElement) {
            // console.warn("Board not ready for drawing."); // Or handle more gracefully
            return;
        }
        this.board.clear();
        this.snake.getBody().forEach(segment => {
            this.board.drawElement(segment, 'snake');
        });
        this.board.drawElement(this.frog.getPosition(), 'frog');
    }

    endGame() {
        clearInterval(this.gameInterval);
        this.isGameOver = true;
        this.uiManager.showGameOver();
    }

    restartGame() {
        this.startGame();
    }
}

// --- Main Execution Logic ---
// This self-invoking function ensures that the CSS and HTML structure are set up
// when the DOM is ready, and then it initializes the game.
(function() {
    function setupAndStartGame() {
        injectCSS();
        createHTMLStructure();
        // Now that HTML structure and CSS are injected, instantiate the Game.
        // The Game class's constructor has its own DOMContentLoaded listener,
        // which will fire and find the elements created by createHTMLStructure.
        const snakeGame = new Game(GRID_SIZE, CELL_SIZE);
    }

    if (document.readyState === 'loading') {
        // Still loading, wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', setupAndStartGame);
    } else {
        // DOM is already loaded, execute immediately
        setupAndStartGame();
    }
})();
