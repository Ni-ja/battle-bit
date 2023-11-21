const walkSnow = new Audio("./assets/audio/walk-snow.mp3");

let inputs = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const setupEventListeners = (socket, canvasEl) => {
  if (!inputs) {
    inputs = { up: false, down: false, left: false, right: false };
  }
  window.addEventListener("keydown", (e) => handleKeyDown(e, socket));
  window.addEventListener("keyup", (e) => handleKeyUp(e, socket));
  window.addEventListener("click", (e) =>
    handleMouseClick(e, socket, canvasEl)
  );
};

const handleKeyDown = (e, socket) => {
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
};

const handleKeyUp = (e, socket) => {
  if (e.key === "w") {
    inputs["up"] = false;
  } else if (e.key === "s") {
    inputs["down"] = false;
  } else if (e.key === "d") {
    inputs["right"] = false;
  } else if (e.key === "a") {
    inputs["left"] = false;
  }
  if (["a", "s", "w", "d"].includes(e.key)) {
    walkSnow.pause();
    walkSnow.currentTime = 0;
  }
  socket.emit("inputs", inputs);
};

const handleMouseClick = (e, socket, canvasEl) => {
  const angle = Math.atan2(
    e.clientY - canvasEl.height / 2,
    e.clientX - canvasEl.width / 2
  );
  socket.emit("snowball", angle);
};

// Call the function to set up event listeners
export { setupEventListeners };
