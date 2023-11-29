const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;

const loadMap = require("./mapLoader");

const SPEED = 5;
const TICK_RATE = 30;
const PLAYER_SIZE = 32;
const TILE_SIZE = 32;

function debug(message) {
  io.emit("debugMessage", message);
}

const abilities = {
  default: {
    effect: (player) => {
      // Apply default snowball effect
      player.health = player.health - 10;
      console.log(`${player.id} hit by default snowball!`);
    },
    range: 0, // No explosion radius for default
    timeLeft: 1000,
    speed: 11,
    fillStyle: "#333333",
  },
  explosive: {
    effect: (player) => {
      // Apply explosive effect to player
      console.log(`${player.id} hit by explosive snowball!`);
      debug(`${player.id} hit by explosive snowball!`);
    },
    range: 100,
    timeLeft: 800, // Explosion radius
    speed: 16,
    fillStyle: "#000000",
  },
  freeze: {
    effect: (player) => {
      // Apply freezing effect to player
      console.log("Player hit by freezing snowball!");
    },
    duration: 3000,
    timeLeft: 2000,
    speed: 5,
    fillStyle: "#FFFFFF",
  },
};

let players = [];
let attacks = [];
const inputsMap = {};
let ground2D, decal2D;

function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.h + rect1.y > rect2.y
  );
}

function isCollidingWithMap(player) {
  for (let row = 0; row < decal2D.length; row++) {
    for (let col = 0; col < decal2D[0].length; col++) {
      const tile = decal2D[row][col];

      if (
        tile &&
        isColliding(
          {
            x: player.x,
            y: player.y,
            w: 32,
            h: 32,
          },
          {
            x: col * TILE_SIZE,
            y: row * TILE_SIZE,
            w: TILE_SIZE,
            h: TILE_SIZE,
          }
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function tick(delta) {
  for (const player of players) {
    const inputs = inputsMap[player.id];
    const previousY = player.y;
    const previousX = player.x;

    if (inputs.up) {
      player.y -= SPEED;
    } else if (inputs.down) {
      player.y += SPEED;
    }

    if (isCollidingWithMap(player)) {
      player.y = previousY;
    }

    if (inputs.left) {
      player.x -= SPEED;
    } else if (inputs.right) {
      player.x += SPEED;
    }

    if (isCollidingWithMap(player)) {
      player.x = previousX;
    }
  }

  for (const attack of attacks) {
    attack.x += Math.cos(attack.angle) * attack.speed;
    attack.y += Math.sin(attack.angle) * attack.speed;
    attack.timeLeft -= delta;

    for (const player of players) {
      if (player.id === attack.playerId) continue;
      const distance = Math.sqrt(
        (player.x + PLAYER_SIZE / 2 - attack.x) ** 2 +
          (player.y + PLAYER_SIZE / 2 - attack.y) ** 2
      );
      if (distance <= PLAYER_SIZE / 2) {
        // Apply snowball effect to player
        if (attack.ability) {
          abilities[attack.ability].effect(player);
        } else {
          // Apply default snowball effect
          console.log("Wrong snowball");
        }
        attack.timeLeft = -1;
        break;
      }
    }
  }

  attacks = attacks.filter((attack) => attack.timeLeft > 0);

  io.emit("players", players);
  io.emit("attacks", attacks);
}
async function main() {
  ({ ground2D, decal2D } = await loadMap());

  io.on("connect", (socket) => {
    console.log("user connected", socket.id);

    inputsMap[socket.id] = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    players.push({
      id: socket.id,
      x: 800,
      y: 800,
      health: 100,
      maxHealth: 100,
    });

    socket.emit("map", {
      ground: ground2D,
      decal: decal2D,
    });

    socket.on("inputs", (inputs) => {
      inputsMap[socket.id] = inputs;
    });

    socket.on("attack", (angle, ability) => {
      debug(ability);
      const player = players.find((player) => player.id === socket.id);
      const attack = abilities[ability];
      attacks.push({
        angle,
        x: player.x,
        y: player.y,
        timeLeft: attack.timeLeft,
        playerId: socket.id,
        ability: ability,
        speed: attack.speed,
        fillStyle: attack.fillStyle, // Add ability parameter
      });
    });

    socket.on("disconnect", () => {
      players = players.filter((player) => player.id !== socket.id);
    });
  });

  app.use(express.static("public"));

  httpServer.listen(PORT);

  let lastUpdate = Date.now();
  setInterval(() => {
    const now = Date.now();
    const delta = now - lastUpdate;
    tick(delta);
    lastUpdate = now;
  }, 1000 / TICK_RATE);
}

main();
