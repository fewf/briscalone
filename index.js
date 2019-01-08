var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000
const game = require('./game/GameEngine')();
// const game = require('./game/GameEngine')([{"trickCards":[4,0,10,20,30,5,31,21,1,11,24,9,39,26,37,18,6,22,19,25,7,32,36,27,2,28,3,34,13,33,29,35,15,14,12,38,16,17,8,23],"shuffle":[28,21,29,38,24,4,27,22,0,2,16,9,19,1,35,3,34,15,17,10,25,39,11,7,20,14,32,26,13,8,5,18,37,6,33,30,12,23,31,36],"bidActions":[4,"P","P","P","P"],"monkeySuit":2},{"trickCards":[22,11,13,10,30,3],"shuffle":[8,21,12,32,30,3,18,15,23,35,7,22,37,4,24,38,6,17,11,2,39,34,26,33,16,27,36,19,25,28,13,29,31,9,14,5,20,1,10,0],"bidActions":[4,"P","P","P","P"],"monkeySuit":3}]);
const cli = require('./cli/main');
const sockets = [];
const playerSockets = [];

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

var wss = new WebSocketServer({server: server})
console.log("websocket server created")

function broadcastGame(game) {
  playerSockets.forEach((ps, i) => ps.websocket.send(JSON.stringify({
    game: serializeGame(game, i),
    seatIndex: i
  })));
}

function displayCards(cards) {
  return cards.map(card => cardGlyphs[card.cardNum]).join(' ');
}

function serializeGame(game, serializeForPlayerIndex) {
  return game.rounds;
}

wss.on("connection", function(ws) {
  sockets.push(ws);

  ws.send('echo');

  console.log("websocket connection open")

  ws.on("message", function(event) {
    const message = JSON.parse(event);
    console.log(message);
    const round = game.loadRound();
    if (message.messageType === 'initialize') {
      const disconnectedSocket = playerSockets.find(
        ps => ps.socketKey === message.message && !ps.websocket
      );
      if (disconnectedSocket) {
        disconnectedSocket.websocket = ws;
        console.log('reseating player ' + playerSockets.indexOf(disconnectedSocket))
        ws.send(JSON.stringify({
          playerIndex: playerSockets.indexOf(disconnectedSocket),
          socketKey: message.message
        }));
        if (game.rounds.length) {
          broadcastGame(game);
        }
      } else if (playerSockets.length < 5) {
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
      if (playerSockets.length === 5) {
        if (!game.rounds.length) {
          game.initializeRound();
        }
        broadcastGame(game);
      }
      return;
    }
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
        if (cli.suitOrder[message.message]) {
          game.setSuit(message.message);
          console.log(`${playerIndex + 1} called ${message.message} monkey`)
          broadcastGame(game);
        }
        break;
    }
    const newRound = game.loadRound();
    console.log('next move is')
    console.log(newRound.nextAction);
  });
  ws.on("close", function() {
    console.log("websocket connection close")
    const playerSocket = playerSockets.find(ps => ps.websocket === ws);
    if (playerSocket) playerSocket.websocket = null;
  })
});
