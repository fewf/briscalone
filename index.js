var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000
const game = require('./game/GameEngine')();
const cli = require('./cli/main');
const playerSockets = [];

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

var wss = new WebSocketServer({server: server})
console.log("websocket server created")

function broadcast(message) {
  playerSockets.forEach(ps => ps.send(message));
}

const cardGlyphs = ['🂢', '🂲', '🃂', '🃒', '🂣', '🂳', '🃃', '🃓', '🂤', '🂴', '🃄', '🃔', '🂥', '🂵', '🃅', '🃕', '🂦', '🂶', '🃆', '🃖', '🂫', '🂻', '🃋', '🃛', '🂭', '🂽', '🃍', '🃝', '🂮', '🂾', '🃎', '🃞', '🂪', '🂺', '🃊', '🃚', '🂡', '🂱', '🃁', '🃑'];
function displayCards(cards) {
  return cards.map(card => cardGlyphs[card.cardNum]).join(' ');
}

wss.on("connection", function(ws) {

  if (playerSockets.length < 5) {
    playerSockets.push(ws);
    console.log(`player ${playerSockets.length} joined`)
    ws.send(`"you are player ${playerSockets.length}"`)


    if (playerSockets.length === 5) {
      broadcast('"game has begun"');
      game.initializePlayers();
      game.initializeRound();
      playerSockets.forEach((pws, i) => pws.send(JSON.stringify(displayCards(game.players[i].hand))));
      playerSockets[game.playerIndex].send('"please make your bid"');
    }
  }

  console.log("websocket connection open")

  ws.on("message", function(event) {
    const message = JSON.parse(event);
    console.log(message);
    if (playerSockets.indexOf(ws) !== game.playerIndex) {
      return;
    }
    switch(message.messageType) {
      case 'bid':
        let bidAction = message.message;
        if (['Y', 'P'].indexOf(bidAction) === -1) {
          bidAction = cli.rankOrder.indexOf(bidAction);
        }
        bidAction = game.validateBidAction(bidAction);
        if (bidAction !== false) {
          broadcast(`"player ${game.playerIndex} bids ${message.message}"`)
          game.pushBidAction(bidAction);
        }
        if (!game.bid.isFinal) {
          playerSockets[game.playerIndex].send('"please make your bid"');
        } else {
          broadcast(`"player ${game.bidderIndex + 1} wins bid with ${cli.rankOrder[game.bid.rank]}"`);
          playerSockets[game.playerIndex].send('"please throw a card"');
          playerSockets[game.playerIndex].send(JSON.stringify(displayCards(game.players[i].hand)));
        }
        break;
      case 'throw':
        let cardIndex = message.message - 1;
        if (isNaN(cardIndex) || !game.players[game.playerIndex].cards[cardIndex]) {
          ws.send('"err try again"');
        } else {
          game.trick.push(game.players[game.playerIndex].cards[cardIndex]);
          broadcast(displayCards(game.trick));
          playerSockets[game.playerIndex].send('"please throw a card"')
        }
        if (game.trick.length === 5) {
          if (isNaN(game.bid.suit)) {
            broadcast('"monkey must be called"')
            playerSockets[game.bidderIndex].send("'call monkey'")
          } else if (!game.players[0].cards.length) {

            broadcast(`"bid side points: ${game.bidTeamPoints}"`)
            broadcast(`"defend side points: ${game.defendTeamPoints}"`)
            game.endRound();
            broadcast(`"${game.players.map(p => p.score).join(' | ')}"`)
          } else {
            const winnerIndex = game.resolveTrickWinner(game.trick);
            game.players[winnerIndex].tricks.push(trick);
            broadcast(`"player ${winnerIndex + 1} takes trick"`)
            game.lastTrick = game.trick;
            game.initializeRound();
          }
        }
        break;
      case 'monkey':
        if (cli.suitOrder.indexOf(message.message) !== -1) {
          playerSockets[game.bidderIndex].send('"C, D, H or S"');
          return
        } else {
          game.bid.suit = cli.suitOrder.indexOf(message.message);
          broadcast(`"monkey suit is ${message.message}"`);
          playerSockets[game.playerIndex].send('"please throw a card"');
        }
        break;
    }
  })
  ws.on("close", function() {
    console.log("websocket connection close")
  })
});
