const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

const setup = document.getElementById("setup");
const game = document.getElementById("game");
const message = document.getElementById("message");

const player1Input = document.getElementById("player1");
const player2Input = document.getElementById("player2");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const name1El = document.getElementById("name1");
const name2El = document.getElementById("name2");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");

const WIDTH = 800;
const HEIGHT = 600;

const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 150;
const PADDLE_SPEED = 6;

const BALL_SIZE = 20;
const MAX_BALL_SPEED = 9;
const MAX_SCORE = 5;

const white = "#fff";
const yellow = "#ffff00";
const black = "#000";

let player1 = "Joueur 1";
let player2 = "Joueur 2";

let leftScore = 0;
let rightScore = 0;

let ballSpeedX = 4;
let ballSpeedY = 4;

let running = false;
let startTime = 0;
let animationId = null;
let lastFrame = 0;

const leftPaddle = {
  x: 20,
  y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};

const rightPaddle = {
  x: WIDTH - 40,
  y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};

const ball = {
  x: WIDTH / 2 - BALL_SIZE / 2,
  y: HEIGHT / 2 - BALL_SIZE / 2,
  width: BALL_SIZE,
  height: BALL_SIZE
};

const keys = new Set();

function resetPaddles() {
  leftPaddle.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
  rightPaddle.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
}

function resetBall(direction = null) {
  ball.x = WIDTH / 2 - BALL_SIZE / 2;
  ball.y = HEIGHT / 2 - BALL_SIZE / 2;

  if (direction === null) {
    direction = Math.random() < 0.5 ? -1 : 1;
  }

  ballSpeedX = Math.abs(ballSpeedX) * direction;

  const choices = [-4, -3, 3, 4];
  ballSpeedY = choices[Math.floor(Math.random() * choices.length)];
}

function drawNet() {
  ctx.strokeStyle = white;
  ctx.lineWidth = 2;

  for (let y = 0; y < HEIGHT; y += 20) {
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, y);
    ctx.lineTo(WIDTH / 2, Math.min(y + 10, HEIGHT));
    ctx.stroke();
  }
}

function draw() {
  ctx.fillStyle = black;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawNet();

  ctx.fillStyle = white;
  ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
  ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

  ctx.beginPath();
  ctx.ellipse(
    ball.x + BALL_SIZE / 2,
    ball.y + BALL_SIZE / 2,
    BALL_SIZE / 2,
    BALL_SIZE / 2,
    0, 0, Math.PI * 2
  );
  ctx.fill();

  ctx.font = "72px Arial";
  ctx.fillText(String(leftScore), 180, 80);
  ctx.fillText(String(rightScore), 560, 80);

  ctx.font = "36px Arial";
  ctx.fillText(player1, 40, 585);

  const rightWidth = ctx.measureText(player2).width;
  ctx.fillText(player2, WIDTH - 40 - rightWidth, 585);

  const elapsed = Math.floor((performance.now() - startTime) / 1000);
  timeEl.textContent = `Temps : ${elapsed}s`;
  scoreEl.textContent = `${leftScore} - ${rightScore}`;
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function bounceOnPaddle(paddle, direction) {
  const relativeY =
    (ball.y + ball.height / 2 - (paddle.y + paddle.height / 2)) /
    (paddle.height / 2);

  const limited = Math.max(-1, Math.min(1, relativeY));

  ballSpeedY = limited * MAX_BALL_SPEED;

  const newSpeed = Math.min(Math.abs(ballSpeedX) + 0.3, MAX_BALL_SPEED);
  ballSpeedX = newSpeed * direction;

  if (direction > 0) {
    ball.x = paddle.x + paddle.width;
  } else {
    ball.x = paddle.x - ball.width;
  }
}

function clampPaddle(paddle) {
  paddle.y = Math.max(0, Math.min(HEIGHT - paddle.height, paddle.y));
}

function update(delta) {
  const factor = delta / (1000 / 60);

  if (keys.has("KeyS")) leftPaddle.y -= PADDLE_SPEED * factor;
  if (keys.has("KeyW")) leftPaddle.y += PADDLE_SPEED * factor;

  if (keys.has("ArrowUp")) rightPaddle.y -= PADDLE_SPEED * factor;
  if (keys.has("ArrowDown")) rightPaddle.y += PADDLE_SPEED * factor;

  clampPaddle(leftPaddle);
  clampPaddle(rightPaddle);

  ball.x += ballSpeedX * factor;
  ball.y += ballSpeedY * factor;

  if (ball.y <= 0) {
    ball.y = 0;
    ballSpeedY = Math.abs(ballSpeedY);
  } else if (ball.y + ball.height >= HEIGHT) {
    ball.y = HEIGHT - ball.height;
    ballSpeedY = -Math.abs(ballSpeedY);
  }

  if (intersects(ball, leftPaddle) && ballSpeedX < 0) {
    bounceOnPaddle(leftPaddle, 1);
  }

  if (intersects(ball, rightPaddle) && ballSpeedX > 0) {
    bounceOnPaddle(rightPaddle, -1);
  }

  if (ball.x + ball.width <= 0) {
    rightScore++;
    resetBall(1);
  } else if (ball.x >= WIDTH) {
    leftScore++;
    resetBall(-1);
  }

  if (leftScore >= MAX_SCORE) {
    endRound(`${player1} gagne !`);
  } else if (rightScore >= MAX_SCORE) {
    endRound(`${player2} gagne !`);
  }
}

function gameLoop(timestamp) {
  if (!running) return;

  if (!lastFrame) lastFrame = timestamp;
  const delta = Math.min(timestamp - lastFrame, 40);
  lastFrame = timestamp;

  update(delta);
  draw();

  if (running) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

function startGame() {
  player1 = player1Input.value.trim() || "Joueur 1";
  player2 = player2Input.value.trim() || "Joueur 2";

  name1El.textContent = player1;
  name2El.textContent = player2;

  leftScore = 0;
  rightScore = 0;
  resetPaddles();

  ballSpeedX = 4;
  ballSpeedY = 4;
  resetBall();

  setup.hidden = true;
  game.hidden = false;

  startTime = performance.now();
  lastFrame = 0;
  running = true;

  draw();
  animationId = requestAnimationFrame(gameLoop);
}

function endRound(text) {
  running = false;

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  message.textContent = text;
  message.hidden = false;

  setTimeout(() => {
    message.hidden = true;
    leftScore = 0;
    rightScore = 0;
    resetPaddles();
    resetBall();
    startTime = performance.now();
    lastFrame = 0;
    running = true;
    animationId = requestAnimationFrame(gameLoop);
  }, 2000);
}

function restartGame() {
  leftScore = 0;
  rightScore = 0;
  resetPaddles();
  resetBall();

  startTime = performance.now();
  lastFrame = 0;

  if (!running) {
    running = true;
    animationId = requestAnimationFrame(gameLoop);
  }

  draw();
}

function setPaddleFromTouch(touch) {
  const rect = canvas.getBoundingClientRect();

  const x = (touch.clientX - rect.left) * WIDTH / rect.width;
  const y = (touch.clientY - rect.top) * HEIGHT / rect.height;

  const isLeft = x < WIDTH / 2;
  const paddle = isLeft ? leftPaddle : rightPaddle;

  paddle.y = y - paddle.height / 2;
  clampPaddle(paddle);
}

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  setPaddleFromTouch(e);
  canvas.setPointerCapture?.(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch" || e.buttons > 0) {
    e.preventDefault();
    setPaddleFromTouch(e);
  }
});

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "KeyW", "KeyS"].includes(e.code)) {
    e.preventDefault();
  }
  keys.add(e.code);
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);

[player1Input, player2Input].forEach(input => {
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") startGame();
  });
});

draw();
