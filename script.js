let balance = parseFloat(localStorage.getItem('balance')) || 0;
let miningRate = parseFloat(localStorage.getItem('miningRate')) || 0.1;
let upgradeCost = parseFloat(localStorage.getItem('upgradeCost')) || 5;
let upgradeCount = 0;
let generationSpeed = parseFloat(localStorage.getItem('generationSpeed')) || 3;

const canvas = document.getElementById("plinko-board");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;
const ballRadius = 10;
const pegRadius = 5;
const pegSpacing = 50;
const rows = 10;
const columns = 11;

let pegs = [];
let balls = [];
let boxes = [];  // Array for the bottom boxes

// Symmetrical multipliers: edges high, center low
const multipliers = [2, 1.5, 1, 0.5, 0.5, 1, 1.5, 2];
const boxWidth = 60;     // Width of each box
const boxHeight = 30;    // Height of each box
const boxSpacing = 5;    // Space between boxes

// Sharper pastel colors for the boxes
const boxColors = [
  "#F9A8D4", "#A2D2FF", "#FEC8D8", "#D1E8E2", 
  "#F5D0A9", "#F1F5F3", "#D9E4F5", "#F4C7A1"
];

function updateUI() {
  document.getElementById('balance').innerText = `Balance: ${formatLargeNumber(balance)} ZNC`;
  document.getElementById('rate').innerText = `Mining Rate: ${miningRate.toFixed(2)} ZNC/sec`;
  document.querySelector('.button').innerText = `Upgrade Mining (Cost: ${formatLargeNumber(upgradeCost)} ZNC)`;
  localStorage.setItem('balance', balance);
  localStorage.setItem('miningRate', miningRate);
  localStorage.setItem('upgradeCost', upgradeCost);
  localStorage.setItem('generationSpeed', generationSpeed);
}

function mineCrypto() {
  balance += miningRate;
  updateUI();
}

function upgradeMining() {
  if (balance >= upgradeCost) {
    balance -= upgradeCost;
    miningRate *= 2;
    upgradeCost = Math.ceil(upgradeCost * 1.8);
    updateUI();
  }
}

function gamble() {
  let bet = parseFloat(document.getElementById('gambleAmount').value);
  if (isNaN(bet) || bet <= 0) {
    displayMessage("Please enter a valid bet amount!");
    return;
  }
  if (balance < bet) {
    displayMessage("Not enough ZNC!");
    return;
  }
  balance -= bet;
  const win = Math.random() > 0.5;
  if (win) {
    balance += bet * 2;
    displayMessage(`You won ${bet * 2} ZNC!`);
  } else {
    displayMessage("You lost! Try again.");
  }
  updateUI();
}

function dropBall() {
  // Use user input for the ball's value
  const ballValue = parseFloat(document.getElementById('ballValue').value);
  if (isNaN(ballValue) || ballValue <= 0) {
    displayMessage("Please enter a valid ZNC value!");
    return;
  }
  if (balance < ballValue) {
    displayMessage("Not enough ZNC to play Plinko!");
    return;
  }
  // Deduct the user-entered ball value from balance
  balance -= ballValue;
  
  const ball = {
    x: width / 2,
    y: 20,
    vx: (Math.random() - 0.5) * 2,  // Small random horizontal speed
    vy: generationSpeed,
    radius: ballRadius,
    value: ballValue,  // Use user-defined ball value
  };

  balls.push(ball);
  animateBall(ball);
  updateUI();
}

function animateBall(ball) {
  const gravity = 0.1;
  const bounce = 0.8;

  function moveBall() {
    ball.vy += gravity;
    ball.y += ball.vy;
    ball.x += ball.vx;

    // Check collision with pegs
    for (let i = 0; i < pegs.length; i++) {
      const peg = pegs[i];
      const dist = Math.hypot(ball.x - peg.x, ball.y - peg.y);
      if (dist < ball.radius + pegRadius) {
        const angle = Math.atan2(ball.y - peg.y, ball.x - peg.x);
        const overlap = ball.radius + pegRadius - dist;
        ball.x += Math.cos(angle) * overlap;
        ball.y += Math.sin(angle) * overlap;
        ball.vx = -ball.vx * bounce + (Math.random() - 0.5) * 2;
        ball.vy = -ball.vy * bounce;
      }
    }

    // Check if ball has reached the bottom (boxes region)
    if (ball.y + ball.radius >= height - 40) {
      ball.vy = 0;
      ball.y = height - 40;

      // Determine which box the ball lands in
      let landedInBox = null;
      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        if (ball.x >= box.x && ball.x <= box.x + box.width) {
          landedInBox = box;
          break;
        }
      }

      if (landedInBox) {
        const winnings = ball.value * landedInBox.multiplier;
        balance += winnings;
        displayMessage(`You won ${winnings} ZNC with a x${landedInBox.multiplier} multiplier!`);
      } else {
        displayMessage("Ball missed the boxes!");
      }
      
      // Remove the ball so it disappears
      balls = balls.filter(b => b !== ball);
    }

    drawBoard();
    if (ball.y < height - 40) {
      requestAnimationFrame(moveBall);
    }
  }
  moveBall();
}

function createPegs() {
  // Create pegs in a triangular pattern
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= row; col++) {
      const x = (width / 2) + (col - row / 2) * pegSpacing;
      const y = 100 + row * pegSpacing;
      pegs.push({ x, y });
    }
  }
}

function createBoxes() {
  // Calculate the starting X to center the boxes
  let boxXStart = (width - ((boxWidth + boxSpacing) * multipliers.length - boxSpacing)) / 2;
  for (let i = 0; i < multipliers.length; i++) {
    const x = boxXStart + i * (boxWidth + boxSpacing);
    const y = height - 40; // Slightly above the bottom border
    boxes.push({ x, y, width: boxWidth, height: boxHeight, multiplier: multipliers[i] });
  }
}

function drawBoard() {
  ctx.clearRect(0, 0, width, height);

  // Draw white pegs
  for (let i = 0; i < pegs.length; i++) {
    const peg = pegs[i];
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, pegRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
  }

  // Draw balls
  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
  }

  // Draw boxes with rounded edges, no border, pastel fill, and black text
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    ctx.beginPath();
    // Draw a rounded rectangle manually using arcTo
    ctx.moveTo(box.x + 10, box.y);
    ctx.arcTo(box.x + box.width, box.y, box.x + box.width, box.y + box.height, 10);
    ctx.arcTo(box.x + box.width, box.y + box.height, box.x, box.y + box.height, 10);
    ctx.arcTo(box.x, box.y + box.height, box.x, box.y, 10);
    ctx.arcTo(box.x, box.y, box.x + box.width, box.y, 10);
    ctx.closePath();
    ctx.fillStyle = boxColors[i % boxColors.length];  // Use our pastel color array
    ctx.fill();

    // Draw multiplier text in black
    ctx.fillStyle = "#000000";
    ctx.font = "16px Arial";
    let text = `x${box.multiplier}`;
    let textWidth = ctx.measureText(text).width;
    ctx.fillText(text, box.x + (box.width - textWidth) / 2, box.y + box.height / 1.5);
  }
}

function displayMessage(message) {
  const messageElement = document.getElementById('plinko-result');
  messageElement.innerText = message;
  setTimeout(() => {
    messageElement.innerText = "";
  }, 3000);
}

function formatLargeNumber(number) {
  if (number >= 1e9) {
    return (number / 1e9).toFixed(2) + 'B';
  } else if (number >= 1e6) {
    return (number / 1e6).toFixed(2) + 'M';
  } else if (number >= 1e3) {
    return (number / 1e3).toFixed(2) + 'K';
  } else {
    return number.toFixed(2);
  }
}

// Initialize pegs and boxes on page load
createPegs();
createBoxes();
drawBoard();

setInterval(mineCrypto, 1000);
updateUI();
