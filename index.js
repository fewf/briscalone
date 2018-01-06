var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000
const game = require('./game/GameEngine')();
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
    game: serializeGame(game, i)
  })));
}

function displayCards(cards) {
  return cards.map(card => cardGlyphs[card.cardNum]).join(' ');
}

function serializeGame(game, serializeForPlayerIndex) {
  let {
    rounds,
    players,
    trick,
    lastTrick,
    bid
  } = game;
  players = JSON.parse(JSON.stringify(players));
  players = players.map(
    (player, i) => i === serializeForPlayerIndex
    ? {...player, isClient: true}
    : {
        ...player,
        hand: player.hand && player.hand.map(card => ({})),
        cards: player.cards && player.cards.map(card => ({}))
      }
  )
  return {
    rounds,
    players,
    trick,
    lastTrick,
    bid
  };
}
game.initializePlayers();

wss.on("connection", function(ws) {
  sockets.push(ws);

  ws.send('echo');

  console.log("websocket connection open")

  ws.on("message", function(event) {
    const message = JSON.parse(event);
    console.log(message);
    if (message.messageType === 'initialize') {
      console.log(playerSockets);
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
      if (playerSockets.length === 5 && !game.bid) {
        game.initializeRound();
        playerSockets.forEach(
          (pws, i) => pws.websocket && pws.websocket.send(
            JSON.stringify({game: serializeGame(game, i)})
          )
        );
      }
      return;
    }
    if (playerSockets.findIndex(ps => ps.websocket === ws) !== game.playerIndex) {
      console.log('hola')
      return;
    }
    switch(message.messageType) {
      case 'bid':
        let bidAction = message.message;
        bidAction = game.validateBidAction(bidAction);
        console.log(bidAction)
        if (bidAction !== false) {
          console.log('sup');
          game.pushBidAction(bidAction);
          broadcastGame(game);
        }
        break;
      case 'throw':
        if (game.pushTrickCard(message.message)) {
          broadcastGame(game);
        }
        break;
      case 'monkey':
        if (cli.suitOrder[message.message]) {
          game.setSuit(message.message);
          broadcastGame(game);
        }
        break;
    }
  });
  ws.on("close", function() {
    console.log("websocket connection close")
    const playerSocket = playerSockets.find(ps => ps.websocket === ws);
    if (playerSocket) playerSocket.websocket = null;
  })
});
