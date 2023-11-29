const mapImage = new Image();
mapImage.src = "/assets/images/snowy-sheet.png";

const santaImage = new Image();
santaImage.src = "/assets/images/santa.png";

const walkSnow = new Audio("/assets/audio/walk-snow.mp3");

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");

const socket = io();

const localTracks = {
  audioTrack: null,
};

let isPlaying = true;

const remoteUsers = {};
window.remoteUsers = remoteUsers;

const uid = Math.floor(Math.random() * 1000000);

let groundMap = [[]];
let decalMap = [[]];
let players = [];
let attacks = [];
let selectedAbility = "default";
const TILE_SIZE = 32;
const SNOWBALL_RADIUS = 5;

socket.on("connect", () => {
  console.log("connected");
});

socket.on("map", (loadedMap) => {
  groundMap = loadedMap.ground;
  decalMap = loadedMap.decal;
});

socket.on("players", (serverPlayers) => {
  players = serverPlayers;
});

socket.on("attacks", (serverAttacks) => {
  attacks = serverAttacks;
});

const inputs = {
  up: false,
  down: false,
  left: false,
  right: false,
};
const debugWindow = document.createElement("div");
debugWindow.style.position = "fixed";
debugWindow.style.top = "0";
debugWindow.style.left = "50%";
debugWindow.style.transform = "translateX(-50%)";
debugWindow.style.padding = "10px";
debugWindow.style.backgroundColor = "#000";
debugWindow.style.color = "#fff";
debugWindow.style.opacity = 0;
debugWindow.style.transition = "opacity 0.3s ease-in-out";

document.body.appendChild(debugWindow);

const calculateHealthBarPercentage = (player) => {
  const healthPercentage = (player.health / player.maxHealth) * 100;
  return Math.min(Math.max(healthPercentage, 0), 100);
};

function drawHealthBar(player, cameraX, cameraY) {
  const healthBarPercentage = calculateHealthBarPercentage(player);
  console.log(healthBarPercentage);
  const healthBarWidth = (healthBarPercentage / 100) * 50;

  canvas.fillStyle = healthBarPercentage > 50 ? "#00FF00" : "#FF0000"; // Adjust color based on health percentage
  canvas.fillRect(
    player.x - cameraX - 10,
    player.y - cameraY - 20,
    healthBarWidth,
    5
  );
}

socket.on("debugMessage", (message) => {
  debugWindow.textContent = message;
  debugWindow.style.opacity = 1;
  console.log(message);

  setTimeout(() => {
    debugWindow.style.opacity = 0;
  }, 1000);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "w") {
    inputs["up"] = true;
  } else if (e.key === "s") {
    inputs["down"] = true;
  } else if (e.key === "d") {
    inputs["right"] = true;
  } else if (e.key === "a") {
    inputs["left"] = true;
  }
  if (["a", "s", "w", "d"].includes(e.key) && walkSnow.paused) {
    walkSnow.play();
  }
  socket.emit("inputs", inputs);
});

window.addEventListener("keyup", (e) => {
  if (e.key === "w") {
    inputs["up"] = false;
  } else if (e.key === "s") {
    inputs["down"] = false;
  } else if (e.key === "d") {
    inputs["right"] = false;
  } else if (e.key === "a") {
    inputs["left"] = false;
  } else if (e.key === "1") {
    selectedAbility = "default";
  } else if (e.key === "2") {
    selectedAbility = "explosive";
  } else if (e.key === "3") {
    selectedAbility = "freeze";
  }
  if (["a", "s", "w", "d"].includes(e.key)) {
    walkSnow.pause();
    walkSnow.currentTime = 0;
  }
  socket.emit("inputs", inputs);
});

window.addEventListener("click", (e) => {
  const angle = Math.atan2(
    e.clientY - canvasEl.height / 2,
    e.clientX - canvasEl.width / 2
  );
  socket.emit("attack", angle, selectedAbility);
});

function loop() {
  canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);

  const myPlayer = players.find((player) => player.id === socket.id);
  let cameraX = 0;
  let cameraY = 0;
  if (myPlayer) {
    cameraX = parseInt(myPlayer.x - canvasEl.width / 2);
    cameraY = parseInt(myPlayer.y - canvasEl.height / 2);
  }

  const TILES_IN_ROW = 8;

  // ground
  for (let row = 0; row < groundMap.length; row++) {
    for (let col = 0; col < groundMap[0].length; col++) {
      let { id } = groundMap[row][col];
      const imageRow = parseInt(id / TILES_IN_ROW);
      const imageCol = id % TILES_IN_ROW;
      canvas.drawImage(
        mapImage,
        imageCol * TILE_SIZE,
        imageRow * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
        col * TILE_SIZE - cameraX,
        row * TILE_SIZE - cameraY,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }

  // decals
  for (let row = 0; row < decalMap.length; row++) {
    for (let col = 0; col < decalMap[0].length; col++) {
      let { id } = decalMap[row][col] ?? { id: undefined };
      const imageRow = parseInt(id / TILES_IN_ROW);
      const imageCol = id % TILES_IN_ROW;

      canvas.drawImage(
        mapImage,
        imageCol * TILE_SIZE,
        imageRow * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
        col * TILE_SIZE - cameraX,
        row * TILE_SIZE - cameraY,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }

  for (const player of players) {
    canvas.drawImage(santaImage, player.x - cameraX, player.y - cameraY);
    drawHealthBar(player, cameraX, cameraY);
  }

  for (const attack of attacks) {
    canvas.fillStyle = attack.fillStyle;
    canvas.beginPath();
    canvas.arc(
      attack.x - cameraX,
      attack.y - cameraY,
      SNOWBALL_RADIUS,
      0,
      2 * Math.PI
    );
    canvas.fill();
  }

  window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);
