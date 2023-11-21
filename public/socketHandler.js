// socketHandlers.js

const handleConnect = () => {
  console.log("connected");
};

const handleMap = (loadedMap) => {
  groundMap = loadedMap.ground;
  decalMap = loadedMap.decal;
  console.log("decalMap", decalMap);
};

const handlePlayers = (serverPlayers) => {
  players = serverPlayers;
};

const handleSnowballs = (serverSnowballs) => {
  snowballs = serverSnowballs;
};

export { handleConnect, handleMap, handlePlayers, handleSnowballs };
