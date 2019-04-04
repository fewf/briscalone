const WebSocketServer = require("ws").Server
const http = require("http")
const express = require("express")
const app = express()
const port = process.env.PORT || 5000;
const isTest = process.argv[2] === '--test';
if (isTest) {
  console.log('running server in test mode');
}

const game = require('./game/GameEngine')();
const playerSockets = [];
const chatMessages = [];

app.use(express.static(__dirname + "/"))
app.use(express.json());

const server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)
if (isTest) {
  app.post('/test/', (req, res) => {
    const ok = handleGamePlayMessage(req.body);
    if (ok) {
      res.send('ok');
    } else {
      throw new Error('not ok');
    }
  });
  // app.post('/test/playfirst/', (req, res) => {let round = game.loadRound(); handleGamePlayMessage({messageType: 'throw', message: round.playerHands[round.playerIndex][0]}); res.send('ok')});
}
const wss = new WebSocketServer({server: server})
console.log("websocket server created")

function broadcastGame(game) {
  playerSockets.forEach((ps, i) => ps.websocket && ps.websocket.send(JSON.stringify({
    game: serializeGame(game, i),
    seatIndex: i
  })));
}

function serializeGame(game, serializeForPlayerIndex) {
  return game.rounds.map(rnd => ({
    ...rnd,
    shuffle: rnd.shuffle.map(
      (num, i) => (
        // card has been played
        rnd.trickCards.indexOf(num) !== -1 ||
        // or card belongs to player
        (i >= serializeForPlayerIndex * 8 && i < (serializeForPlayerIndex + 1) *8)
      ) ? num : -1
    )
  }));
}

function reconnectSocket(disconnectedSocket, newSocket, username) {
  disconnectedSocket.websocket = newSocket;
  console.log('reseating player ' + username)
  newSocket.send(JSON.stringify({
    seatIndex: playerSockets.indexOf(disconnectedSocket),
    usernames: playerSockets.map(pss => pss.username)
  }));
  if (game.rounds.length) {
    broadcastGame(game);
  }
}

function addPlayerSocket(ws, username) {
  const seatIndex = playerSockets.push({
    websocket: ws,
    username
  }) - 1;
  console.log(`player ${username} joined`);
  ws.send(JSON.stringify({
    seatIndex,
    usernames: playerSockets.map(pss => pss.username)
  }));
}
function initializeSocket(ws, username) {
  const disconnectedSocket = playerSockets.find(
    ps => ps.username === username && !ps.websocket
  );
  if (disconnectedSocket) {
    reconnectSocket(disconnectedSocket, ws, username);
  } else if (playerSockets.length < 5) {
    addPlayerSocket(ws, username)
  }
  if (playerSockets.length === 5) {
    if (!game.rounds.length) {
      game.initializeRound(isTest ? {
        shuffle: [
          // player 1 will put up some resistance
          4, 5, 6, 16, 18, 19, 20, 21,
          // players 2 and 3 would make a killer team
          // but since they don't know they're
          // just along for the ride
          30, 31, 32, 33, 34, 26, 27, 29,
          22, 23, 24, 25, 35, 36, 37, 38,
          // player 4's gonna be 5's partner
          0, 1, 10, 11, 12, 13, 14, 15,
          // player 5's gonna win
          2, 3, 7, 8, 9, 17, 28, 39
        ],
      } : {});
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

  handleGamePlayMessage(message);
}

function handleGamePlayMessage(message) {
  console.log(message);
  let stateChanged = false;
  const round = game.loadRound();
  const playerIndex = round.playerIndex;
  switch(message.messageType) {
    case 'bid':
      stateChanged = game.pushBidAction(message.message);
      if (stateChanged) {
        console.log(`${playerIndex + 1} bid ${message.message}`);
        stateChanged = true;
        broadcastGame(game);
      }
      break;
    case 'throw':
      const updatedRound = game.pushTrickCard(message.message);
      if (updatedRound) {
        stateChanged = true;
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
        stateChanged = true;
        console.log(`${playerIndex + 1} called ${message.message} monkey`)
        broadcastGame(game);
      }
      break;
  }
  const newRound = game.loadRound();
  console.log('next move is')
  console.log(newRound.nextAction);
  return stateChanged;
}

function pushChatMessage(message) {

  chatMessages.push(message);

  playerSockets.forEach(ps => ps.websocket.send(JSON.stringify({
    chatMessages
  })));
}

wss.on("connection", function(ws) {
  ws.send('echo');

  console.log("websocket connection open")

  ws.on("message", function(event) {
    const message = JSON.parse(event);
    console.log(message);
    if (message.messageType === 'initialize') {
      initializeSocket(ws, message.message);
    } else if (message.messageType === 'chat') {
      pushChatMessage(message.message);
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

// ping client every 30 seconds so connection doesn't die
setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(Number(new Date()));
  });
}, 30000);
