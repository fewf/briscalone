const WebSocketServer = require("ws").Server
const http = require("http")
const express = require("express")
const app = express()
const port = process.env.PORT || 5000

const game = require('./game/GameEngine')();
const playerSockets = [];

app.use(express.static(__dirname + "/"))

const server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

const wss = new WebSocketServer({server: server})
console.log("websocket server created")

function broadcastGame(game) {
  playerSockets.forEach((ps, i) => ps.websocket.send(JSON.stringify({
    game: serializeGame(game, i),
    seatIndex: i
  })));
}

function serializeGame(game, serializeForPlayerIndex) {
  return game.rounds;
}

function reconnectSocket(disconnectedSocket, newSocket, socketKey) {
  disconnectedSocket.websocket = newSocket;
  console.log('reseating player ' + playerSockets.indexOf(disconnectedSocket))
  newSocket.send(JSON.stringify({
    playerIndex: playerSockets.indexOf(disconnectedSocket),
    socketKey
  }));
  if (game.rounds.length) {
    broadcastGame(game);
  }
}

function addPlayerSocket(ws) {
  const playerIndex = playerSockets.push({
    websocket: ws,
    socketKey: Math.random().toString(36).substring(6)
  }) - 1;
  console.log(`player ${playerSockets.length} joined`);
  ws.send(JSON.stringify({
    playerIndex,
    socketKey: playerSockets[playerIndex].socketKey
  }));
}
function initializeSocket(ws, socketKey) {

  const disconnectedSocket = playerSockets.find(
    ps => ps.socketKey === socketKey && !ps.websocket
  );
  if (disconnectedSocket) {
    reconnectSocket(disconnectedSocket, ws, socketKey);
  } else if (playerSockets.length < 5) {
    addPlayerSocket(ws)
  }
  if (playerSockets.length === 5) {
    if (!game.rounds.length) {
      game.initializeRound();
    }
    broadcastGame(game);
  }
}

function handleGamePlay(ws, message) {

  const round = game.loadRound();
  const playerIndex = round.playerIndex;
  if (playerSockets.findIndex(ps => ps.websocket === ws) !== playerIndex) {
    console.log('Not your turn.')
    return;
  }
  if (round.nextAction !== message.messageType) {
    console.log('not next action')
    return;
  }
  switch(message.messageType) {
    case 'bid':
      let bidAction = message.message;
      if (game.pushBidAction(bidAction) !== false) {
        console.log(`${playerIndex + 1} bid ${bidAction}`)
        broadcastGame(game);
      }
      break;
    case 'throw':
      const updatedRound = game.pushTrickCard(message.message);
      if (updatedRound !== false) {

        console.log(`${playerIndex + 1} threw ${message.message}`)
        if (updatedRound.isFinal) {
          console.log('new round initialized')
          game.initializeRound();
        }
        broadcastGame(game);
      }
      break;
    case 'monkey':
      if (message.message > -1 && message.message < 4) {
        game.setSuit(message.message);
        console.log(`${playerIndex + 1} called ${message.message} monkey`)
        broadcastGame(game);
      }
      break;
  }
  const newRound = game.loadRound();
  console.log('next move is')
  console.log(newRound.nextAction);
}

wss.on("connection", function(ws) {
  ws.send('echo');

  console.log("websocket connection open")

  ws.on("message", function(event) {
    const message = JSON.parse(event);
    console.log(message);
    if (message.messageType === 'initialize') {
      initializeSocket(ws, message.message);
    } else {
      handleGamePlay(ws, message);
    }
  });
  ws.on("close", function() {
    console.log("websocket connection close")
    const playerSocket = playerSockets.find(ps => ps.websocket === ws);
    if (playerSocket) playerSocket.websocket = null;
  })
});
