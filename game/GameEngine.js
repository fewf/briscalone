"use strict"

const shuffle = require('lodash/shuffle');
const random = require('lodash/random');
const sortBy = require('lodash/sortBy');
const flatten = require('lodash/flatten');
const dropRightWhile = require('lodash/dropRightWhile');
const promptSync = require('prompt-sync')();

function prompt(msg) {
  let response = promptSync(msg);
  if (response === null) {
    throw('bye now');
  }
  return response;
}

const game = {
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
  rounds: [],
  tricks: [],
  initializePlayers() {
    const game = this;
    this.players = [...Array(5).keys()].map(() => ({
      score: 0,
      get cards() {
        return this.hand.filter(
          card => game.trickCards.indexOf(card) === -1
        )
      }
    }))
  },

  get trickCards() {
    return flatten(flatten(this.players.map(p => p.tricks)));
  },
  deal() {
    const cards = shuffle([...Array(40).keys()]).map(cardNum => this.getCard(cardNum));
    this.players = this.players.map(
      (player, i) => Object.assign(
        player,
        {
          hand: sortBy(
            cards.slice(i * 8, i * 8 + 8),
            ['suit', 'rank']
          ),
          tricks: [],
        }
      )
    );
  },

  getSuit(cardNum) {
    return Math.floor(cardNum / 10);
  },

  getRank(cardNum) {
    return cardNum % 10;
  },

  getPoints(rank) {
    return rank < 5 ? 0 : [2, 3, 4, 10, 11][rank - 5];
  },

  getPointsForCards(cards) {
    return cards.reduce((total, card) => total + this.getPoints(card.rank), 0);
  },

  getCard(cardNum) {
    return {
      rank: this.getRank(cardNum),
      suit: this.getSuit(cardNum),
      cardNum
    };
  },

  displayCards(cards) {
    return cards.map(this.displayCard.bind(this)).join(' ')
  },

  displayCard(card) {
    return `${this.rankOrder[card.rank]}${this.suitOrder[card.suit]}`;
  },

  initializeBid() {
    this.bid = {
      // keeps track of bid responses
      // each item can be: rank, P for pass or Y for point bid]
      bidActions: [],
      // records monkey suit
      suit: null,

      get rank() {
        if (!this.bidActions.length) {
          return Number.POSITIVE_INFINITY;
        }
        const onlyRanks = this.bidActions.filter(ba => !isNaN(ba));
        return onlyRanks[onlyRanks.length - 1];
      },
      get points() {
        const onlyYs = this.bidActions.filter(ba => ba === 'Y');
        return onlyYs.length * 2 + 61;
      },
      get isFinal() {
        // bid is final if the points have been incremented to 119
        // or the last 4 bid actions are passes
        return this.points === 119 || this.bidActions.slice(
          this.bidActions.length - 4,
          this.bidActions.length
        ).filter(ba => ba === 'P').length === 4;
      }
    }
  },
  // index position of bidder in this.players
  get bidderIndex() {
    const ignoreEndPasses = dropRightWhile(
      this.bid.bidActions,
      ba => ba === 'P'
    );
    return (this.roundFirstPlayerIndex + ignoreEndPasses.length - 1) % 5;
  },
  // index position of partner in this.players
  get partnerIndex() {
    const partnerCardNum = this.bid.suit * 10 + this.bid.rank;
    return this.getPlayerIndexWithCardNum(partnerCardNum);
  },

  getPlayerIndexWithCardNum(cardNum) {
    return this.players.findIndex(
      player => player.hand.map(card => cardNum).indexOf(cardNum) !== -1
    )
  },

  pushBidAction(bidAction) {
    this.bid.bidActions.push(bidAction);
  },


  get roundFirstPlayerIndex() {
    return this.rounds.length % 5;
  },
  requestBidAction() {
    const {playerIndex} = this;
    console.log(`player ${playerIndex + 1}`)
    console.log(this.displayCards(this.players[playerIndex].cards));
    const bidRank = this.bid.rank;

    if (!this.rankOrder[bidRank]) {
      console.log('make the first bid');
    } else if (bidRank !== 0) {
      console.log(`you must bid lower than ${this.rankOrder[bidRank]}`);
    } else {
      console.log(`do you bid 2 and ${this.bid.points + 2} points? type Y`)
    }

    const ret = prompt('your bid, please? ');
    console.log(ret);
    return ret;
  },

  validateBidAction(bidAction) {
    if (['Y', 'P'].indexOf(bidAction) === -1) {
      bidAction = this.rankOrder.indexOf(bidAction);
    }
    const currentBidRank = this.bid.rank;
    return (
      (this.rankOrder[currentBidRank] && bidAction === 'P') ||
      (currentBidRank === 0 && bidAction === 'Y') ||
      (bidAction > -1 && bidAction < currentBidRank)
    ) && bidAction;
  },

  resolveBid() {
    let resBid;
    this.initializeBid();
    while (!this.bid.isFinal) {
      resBid = this.validateBidAction(this.requestBidAction());
      if (resBid !== false) {
        console.log(`received bid ${resBid}`)
        this.pushBidAction(resBid);
      }
    }
    console.log(`player ${this.bidderIndex + 1} wins bid with ${this.rankOrder[this.bid.rank]}`);
  },

  get playerIndex() {
    let preModulo;
    if (this.lastTrick) {
      preModulo = this.players.indexOf(
        this.players.find(
          player => player.tricks.indexOf(this.lastTrick) !== -1
        )
      ) + this.trick.length
    } else {
      preModulo = this.roundFirstPlayerIndex + (
        this.bid && this.bid.isFinal
        ? this.trick.length
        : this.bid.bidActions.length
      )
    }
    return preModulo % 5;
  },

  requestTrickCard() {
    let {playerIndex} = this;
    console.log(`player ${playerIndex + 1}`)
    console.log(this.displayCards(this.players[playerIndex].cards));
    let resCard = prompt('throw a card: ');
    while(isNaN(resCard) || resCard < 1 || resCard > this.players[playerIndex].cards.length) {
      console.log('err');
      resCard = prompt('throw a card: ');
    }
    return this.players[playerIndex].cards[resCard - 1];

    console.log(this.displayCards(trick));
  },

  requestBidSuit() {
    console.log('please announce trump');
    const bidder = this.players[this.bidderIndex];

    console.log(`player ${this.bidderIndex + 1}`)
    console.log(this.displayCards(bidder.cards));
    let resSuit;
    while ([undefined, -1].indexOf(resSuit) !== -1) {
      resSuit = this.suitOrder.indexOf(
        prompt('pick a trump suit (H, C, D or S): ')
      );
    }
    return resSuit;

  },

  playTrick() {
    const trick = this.trick = [];
    while (trick.length < 5) {
      trick.push(this.requestTrickCard());
    }
    if (!this.bid.suit) {
      this.bid.suit = this.requestBidSuit();
    }
    const winnerIndex = this.resolveTrickWinner(trick);
    this.players[winnerIndex].tricks.push(trick);
    console.log(`player ${winnerIndex + 1} takes trick`)
    this.lastTrick = trick;
    return trick;
  },

  resolveTrickWinner(trick) {
    let winner = trick[0];
    let contender;
    for (var i = 1; i < trick.length; i++) {
      contender = trick[i];
      if (contender.suit === this.bid.suit) {
        if (winner.suit !== this.bid.suit) {
          winner = contender;
        } else {
          winner = winner.rank > contender.rank ? winner : contender;
        }
      } else if (contender.suit === winner.suit) {
        winner = winner.rank > contender.rank ? winner : contender;
      }
    }
    return this.getPlayerIndexWithCardNum(winner.cardNum);
  },

  getBidTeamPoints() {
    const trickCards = flatten(
      this.players[this.bidderIndex].tricks.concat(
        !this.bidderIsPartner
        ? this.players[this.partnerIndex].tricks
        : []
      )
    );
    return this.getPointsForCards(trickCards);
  },

  getDefendTeamPoints() {
    const trickCards = flatten(flatten(this.players.filter(
      (p, i) => [this.bidderIndex, this.partnerIndex].indexOf(i) === -1
    ).map(p => p.tricks)));
    return this.getPointsForCards(trickCards);
  },
  get bidderIsPartner() {
    return this.bidderIndex === this.partnerIndex;
  },
  isBidTeam(playerIndex) {
    return [this.bidderIndex, this.partnerIndex].indexOf(playerIndex) !== -1;
  },
  scorePlayer(playerIndex, bidTeamWins) {
    return (
      this.isBidTeam(playerIndex) === bidTeamWins
      ? 1
      : -1
    ) * (
      playerIndex === this.bidderIndex
      ? this.bidderIsPartner ? 4 : 2
      : 1
    );
  },
  scoreRound(bidTeamWins) {
    this.players.forEach((p, index) => p.score += this.scorePlayer(index, bidTeamWins));
    if (this.players.reduce((sum, player) => sum += player.score, 0) !== 0) {
      console.log('WARNING: scores do not sum to 0')
    }
  },

  main() {
    this.initializePlayers();
    while (!this.players.filter(player => player.score >= 3).length) {
      this.deal()
      this.resolveBid()
      while (this.players[0].cards.length) {
        this.playTrick();
        console.log(this.players)

        if (!this.suitOrder[this.bid.suit]) {
          this.bid.suit = this.requestBidSuit();

          console.log(`partner is player ${this.partnerIndex + 1}`)
          console.log(this.displayCards(this.players[partnerIndex].hand));
        }
      }
      const bidTeamPoints = this.getBidTeamPoints();
      const defendTeamPoints = this.getDefendTeamPoints();

      this.scoreRound(bidTeamPoints >= this.bid.points);
      console.log(`bid side points: ${bidTeamPoints}`)
      console.log(`defend side points: ${defendTeamPoints}`)
      console.log(`${bidTeamPoints >= this.bid.points ? 'bid' : 'defend'} team wins!`)
      console.log(this.players.map(p => p.score).join(' | '))

      this.trick = null;
      this.lastTrick = null;
      this.rounds.push(this.players.map(p => p.tricks));
    }
  },
}

game.main();
// module.exports = game;
