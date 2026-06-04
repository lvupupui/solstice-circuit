const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const lightValue = document.querySelector("#light-value");
const levelValue = document.querySelector("#level-value");
const turnValue = document.querySelector("#turn-value");
const progressValue = document.querySelector("#progress-value");
const title = document.querySelector("#status-title");
const copy = document.querySelector("#status-copy");
const resetButton = document.querySelector("#reset-button");
const demoButton = document.querySelector("#demo-button");
const demoPanelButton = document.querySelector("#demo-panel-button");
const hintButton = document.querySelector("#hint-button");

const tile = 80;
const cols = 12;
const rows = 8;
const SUNNY_COST = 4;
const SHADOW_GAIN = 18;
const STONE_COST = 10;
const STONE_MIN_LIGHT = 14;
const DEMO_ROUTE = "URRURRUURDRRUDUDDDRUUUUR";

const levels = [
  {
    player: { x: 1, y: 6 },
    gate: { x: 10, y: 1 },
    stones: [
      { x: 3, y: 5, lit: false, code: "01" },
      { x: 6, y: 2, lit: false, code: "10" },
      { x: 9, y: 5, lit: false, code: "11" },
    ],
    shadows: [
      { x: 2, y: 2 },
      { x: 5, y: 6 },
      { x: 8, y: 3 },
    ],
    walls: [
      { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 },
      { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 6 },
      { x: 1, y: 3 }, { x: 10, y: 4 },
    ],
  },
  {
    player: { x: 1, y: 1 },
    gate: { x: 10, y: 6 },
    stones: [
      { x: 2, y: 5, lit: false, code: "00" },
      { x: 5, y: 1, lit: false, code: "01" },
      { x: 8, y: 6, lit: false, code: "10" },
      { x: 9, y: 2, lit: false, code: "11" },
    ],
    shadows: [
      { x: 1, y: 4 },
      { x: 4, y: 6 },
      { x: 6, y: 3 },
      { x: 10, y: 4 },
    ],
    walls: [
      { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 },
      { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 },
      { x: 7, y: 1 }, { x: 7, y: 2 },
      { x: 10, y: 1 }, { x: 1, y: 6 },
    ],
  },
];

let state;
let levelIndex = 0;
let animationStarted = false;
let demoTimer = null;

function cloneLevel(level) {
  return JSON.parse(JSON.stringify(level));
}

function reset() {
  stopDemo();
  state = {
    ...cloneLevel(levels[levelIndex]),
    light: 72,
    turn: 1,
    won: false,
    lost: false,
    pulse: 0,
  };
  setMessage(
    levelIndex === 0 ? "The sun is high." : "The second circle wakes.",
    "Charge the dawn cipher before dusk. Step into shadow to recover daylight."
  );
  updateHud();
}

function cellKey(cell) {
  return `${cell.x},${cell.y}`;
}

function hasAt(list, x, y) {
  return list.some((item) => item.x === x && item.y === y);
}

function getStone(x, y) {
  return state.stones.find((stone) => stone.x === x && stone.y === y);
}

function allLit() {
  return state.stones.every((stone) => stone.lit);
}

function litCount() {
  return state.stones.filter((stone) => stone.lit).length;
}

function setMessage(nextTitle, nextCopy) {
  title.textContent = nextTitle;
  copy.textContent = nextCopy;
}

function updateHud() {
  lightValue.textContent = state.light;
  levelValue.textContent = levelIndex + 1;
  turnValue.textContent = state.turn;
  progressValue.textContent = `${litCount()} / ${state.stones.length}`;
}

function move(dx, dy) {
  if (state.won || state.lost) return;
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;
  if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return;
  if (hasAt(state.walls, nx, ny)) {
    setMessage("Stone blocks the path.", "The solstice ring only opens to careful movement.");
    return;
  }

  state.player.x = nx;
  state.player.y = ny;
  state.turn += 1;

  const shadow = hasAt(state.shadows, nx, ny);
  const stone = getStone(nx, ny);

  if (shadow) {
    state.light = Math.min(90, state.light + SHADOW_GAIN);
    setMessage("Shadow well.", "The cool ground returns a little daylight to your lantern.");
  } else {
    state.light -= SUNNY_COST;
  }

  if (stone && !stone.lit) {
    if (state.light >= STONE_MIN_LIGHT) {
      stone.lit = true;
      state.light -= STONE_COST;
      setMessage("Cipher bit charged.", "The ring hums louder. Keep enough daylight for the final crossing.");
    } else {
      setMessage("Not enough daylight.", "Step into a shadow well before trying to charge this obelisk.");
    }
  }

  if (state.player.x === state.gate.x && state.player.y === state.gate.y) {
    if (allLit()) {
      if (levelIndex < levels.length - 1) {
        levelIndex += 1;
        state = {
          ...cloneLevel(levels[levelIndex]),
          light: Math.max(54, state.light + 8),
          turn: state.turn + 1,
          won: false,
          lost: false,
          pulse: state.pulse,
        };
        setMessage("A second cipher appears.", "The solstice gives you one more crossing. The path is tighter now.");
      } else {
        state.won = true;
        setMessage("The solstice turns.", "You lit the ring before dusk. The longest day becomes a new beginning.");
      }
    } else {
      setMessage("The ring is silent.", "Every obelisk must be lit before the gate will answer.");
    }
  }

  if (state.light <= 0 && !state.won) {
    state.light = 0;
    state.lost = true;
    setMessage("Dusk falls.", "The lantern is empty. Reset and use the shadow wells more deliberately.");
  }

  updateHud();
}

function drawTile(x, y, fill, stroke = "rgba(255,255,255,0.08)") {
  ctx.fillStyle = fill;
  ctx.fillRect(x * tile, y * tile, tile, tile);
  ctx.strokeStyle = stroke;
  ctx.strokeRect(x * tile + 0.5, y * tile + 0.5, tile - 1, tile - 1);
}

function drawCircle(x, y, radius, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x * tile + tile / 2, y * tile + tile / 2, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function draw() {
  state.pulse += 0.05;

  const sky = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  sky.addColorStop(0, "#202744");
  sky.addColorStop(0.55, "#101726");
  sky.addColorStop(1, "#090d15");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const sun = 0.08 + (x + y) / 190;
      drawTile(x, y, `rgba(245, 200, 75, ${sun})`);
    }
  }

  for (const shadow of state.shadows) {
    drawTile(shadow.x, shadow.y, "rgba(39, 48, 74, 0.92)", "rgba(71, 215, 194, 0.18)");
    drawCircle(shadow.x, shadow.y, 18, "rgba(71, 215, 194, 0.22)");
  }

  for (const wall of state.walls) {
    drawTile(wall.x, wall.y, "rgba(9, 12, 20, 0.98)", "rgba(255,255,255,0.16)");
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(wall.x * tile + 16, wall.y * tile + 18, 48, 8);
    ctx.fillRect(wall.x * tile + 16, wall.y * tile + 38, 48, 8);
  }

  drawCircle(
    state.gate.x,
    state.gate.y,
    27 + (allLit() ? Math.sin(state.pulse * 8) * 3 : 0),
    "rgba(143, 117, 255, 0.2)",
    allLit() ? "rgba(143, 117, 255, 0.95)" : "rgba(143, 117, 255, 0.35)"
  );

  for (const stone of state.stones) {
    drawCircle(
      stone.x,
      stone.y,
      24,
      stone.lit ? "rgba(245, 200, 75, 0.85)" : "rgba(160, 148, 122, 0.42)",
      stone.lit ? "rgba(255, 244, 180, 0.95)" : "rgba(255,255,255,0.22)"
    );
    ctx.fillStyle = stone.lit ? "#10131a" : "rgba(255,255,255,0.68)";
    ctx.font = "700 21px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(stone.lit ? "ON" : stone.code, stone.x * tile + tile / 2, stone.y * tile + tile / 2);
  }

  drawCircle(state.player.x, state.player.y, 22, "rgba(71, 215, 194, 0.92)", "rgba(244, 240, 220, 0.9)");
  ctx.fillStyle = "#10131a";
  ctx.font = "700 22px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("S", state.player.x * tile + tile / 2, state.player.y * tile + tile / 2);

  if (state.won || state.lost) {
    ctx.fillStyle = "rgba(0,0,0,0.54)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f4f0dc";
    ctx.font = "800 54px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(state.won ? "SOLSTICE COMPLETE" : "DUSK WINS", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "500 20px system-ui";
    ctx.fillText("Press Reset to play again", canvas.width / 2, canvas.height / 2 + 34);
  }
}

function nearestTarget(list) {
  return list
    .map((item) => ({
      ...item,
      distance: Math.abs(item.x - state.player.x) + Math.abs(item.y - state.player.y),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}

function showHint() {
  if (state.won || state.lost) return;
  const unlit = state.stones.filter((stone) => !stone.lit);
  if (unlit.length === 0) {
      setMessage("The ring is ready.", "All cipher bits are charged. Head for the violet solstice ring.");
    return;
  }
  if (state.light < 30) {
    const shadow = nearestTarget(state.shadows);
    setMessage("Seek shadow first.", `The nearest shadow well is ${shadow.distance} moves away.`);
    return;
  }
  const stone = nearestTarget(unlit);
  setMessage("Charge a cipher bit.", `The nearest unlit cipher obelisk is ${stone.distance} moves away.`);
}

function stopDemo() {
  if (!demoTimer) return;
  window.clearInterval(demoTimer);
  demoTimer = null;
}

function runDemo() {
  levelIndex = 0;
  reset();
  const vectors = {
    U: [0, -1],
    D: [0, 1],
    L: [-1, 0],
    R: [1, 0],
  };
  const route = DEMO_ROUTE.split("");
  let index = 0;
  setMessage("Demo route.", "Watch the seeker charge the dawn cipher and open the first ring.");
  demoTimer = window.setInterval(() => {
    if (index >= route.length || state.won || state.lost) {
      stopDemo();
      if (!state.lost) {
        setMessage("Demo complete.", "The first ring is open. Continue manually or reset to record again.");
      }
      return;
    }
    const [dx, dy] = vectors[route[index]];
    index += 1;
    move(dx, dy);
  }, 260);
}

function maybeAutoStartDemo() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("recording") === "1") {
    document.body.classList.add("recording");
  }
  if (params.get("demo") !== "1") return;
  window.setTimeout(runDemo, 700);
}

function animate() {
  draw();
  window.requestAnimationFrame(animate);
}

document.addEventListener("keydown", (event) => {
  const controls = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    w: [0, -1],
    s: [0, 1],
    a: [-1, 0],
    d: [1, 0],
  };
  const vector = controls[event.key];
  if (!vector) return;
  event.preventDefault();
  move(vector[0], vector[1]);
});

document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => {
    const [dx, dy] = button.dataset.move.split(",").map(Number);
    move(dx, dy);
  });
});

resetButton.addEventListener("click", () => {
  levelIndex = 0;
  reset();
});

hintButton.addEventListener("click", showHint);
demoButton.addEventListener("click", runDemo);
demoPanelButton.addEventListener("click", runDemo);

reset();
maybeAutoStartDemo();
if (!animationStarted) {
  animationStarted = true;
  animate();
}
