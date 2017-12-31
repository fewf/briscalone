const promptSync = require('prompt-sync')();
const GameEngine = require('../game/GameEngine');

function prompt(msg) {
  let response = promptSync(msg);
  if (response === null) {
    throw('bye now');
  }
  return response;
}

const cli = {

  rankOrder: [
    '2',
    '3',
    '4',
    '5',
    '6',
    'J',
    'Q',
    'K',
    'X',
    'A'
  ],

  suitOrder: [
    'C',
    'D',
    'H',
    'S'
  ],

  displayCards(cards) {
    return cards.map(this.displayCard.bind(this)).join(' ');
  },

  displayCard(card) {
    return `${this.rankOrder[card.rank]}${this.suitOrder[card.suit]}`;
  },

  requestBidAction(game) {
    const {playerIndex} = game;
    console.log(`player ${playerIndex + 1}`)
    console.log(this.displayCards(game.players[playerIndex].cards));
    const bidRank = game.bid.rank;

    if (!this.rankOrder[bidRank]) {
      console.log('make the first bid');
    } else if (bidRank !== 0) {
      console.log(`you must bid lower than ${this.rankOrder[bidRank]}`);
    } else {
      console.log(`do you bid 2 and ${game.bid.points + 2} points? type Y`)
    }

    const ret = prompt('your bid, please? ');
    console.log(ret);
    return ret;
  },



  resolveBid(game) {
    let resBid;
    game.initializeBid();
    while (!game.bid.isFinal) {
      resBid = this.requestBidAction(game);
      if (['Y', 'P'].indexOf(resBid) === -1) {
        resBid = this.rankOrder.indexOf(resBid);
      }
      resBid = game.validateBidAction(resBid);
      // resBid can be 0
      if (resBid !== false) {
        console.log(`received bid ${resBid}`)
        game.pushBidAction(resBid);
      }
    }
    console.log(`player ${game.bidderIndex + 1} wins bid with ${this.rankOrder[game.bid.rank]}`);
  },

  requestTrickCard(game) {
    let {playerIndex} = game;
    console.log(`player ${playerIndex + 1}`)
    console.log(this.displayCards(game.players[playerIndex].cards));
    let resCard = prompt('throw a card: ');
    while(isNaN(resCard) || resCard < 1 || resCard > game.players[playerIndex].cards.length) {
      console.log('err');
      resCard = prompt('throw a card: ');
    }
    return game.players[playerIndex].cards[resCard - 1];

    console.log(this.displayCards(trick));
  },

  requestBidSuit(game) {
    console.log('please announce trump');
    const bidder = game.players[game.bidderIndex];

    console.log(`player ${game.bidderIndex + 1}`)
    console.log(this.displayCards(bidder.cards));
    let resSuit;
    while ([undefined, -1].indexOf(resSuit) !== -1) {
      resSuit = this.suitOrder.indexOf(
        prompt('pick a trump suit (H, C, D or S): ')
      );
    }
    return resSuit;

  },

  playTrick(game) {
    const trick = game.trick = [];
    while (trick.length < 5) {
      trick.push(this.requestTrickCard(game));
      console.log(this.displayCards(trick));
    }

    if (!this.suitOrder[game.bid.suit]) {
      game.bid.suit = this.requestBidSuit(game);

      console.log(`partner is player ${game.partnerIndex + 1}`)
      console.log(this.displayCards(game.players[game.partnerIndex].hand));
    }
    const winnerIndex = game.resolveTrickWinner(trick);
    console.log(winnerIndex);
    game.players[winnerIndex].tricks.push(trick);
    console.log(`player ${winnerIndex + 1} takes trick`)
    game.lastTrick = trick;
    return trick;
  },

  main() {
    const game = GameEngine();
    game.initializePlayers();
    while (!game.players.filter(player => player.score >= 3).length) {
      game.deal()
      this.resolveBid(game);
      while (game.players[0].cards.length) {
        this.playTrick(game);
        console.log(game.players)
      }

      console.log(`bid side points: ${game.bidTeamPoints}`)
      console.log(`defend side points: ${game.defendTeamPoints}`)
      game.endRound();
      console.log(game.players.map(p => p.score).join(' | '))
    }
  }
};

cli.main();
