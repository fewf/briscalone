"use strict"

const shuffle = require('lodash/shuffle');
const random = require('lodash/random');
const sortBy = require('lodash/sortBy');
const flatten = require('lodash/flatten');
const dropRightWhile = require('lodash/dropRightWhile');

module.exports = () => ({
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

  get roundFirstPlayerIndex() {
    return this.rounds.length % 5;
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

  get bidderIsPartner() {
    return this.bidderIndex === this.partnerIndex;
  },

  get bidTeamPoints() {
    const trickCards = flatten(
      this.players[this.bidderIndex].tricks.concat(
        !this.bidderIsPartner
        ? this.players[this.partnerIndex].tricks
        : []
      )
    );
    return this.getPointsForCards(trickCards);
  },

  get defendTeamPoints() {
    const trickCards = flatten(flatten(this.players.filter(
      (p, i) => [this.bidderIndex, this.partnerIndex].indexOf(i) === -1
    ).map(p => p.tricks)));
    return this.getPointsForCards(trickCards);
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

  getPlayerIndexWithCardNum(cardNum) {
    return this.players.findIndex(
      (player, i) => player.hand.map(card => card.cardNum).indexOf(cardNum) !== -1
    );
  },

  pushBidAction(bidAction) {
    this.bid.bidActions.push(bidAction);
  },

  validateBidAction(bidAction) {
    const currentBidRank = this.bid.rank;
    return (
      (!isNaN(currentBidRank) && bidAction === 'P') ||
      (currentBidRank === 0 && bidAction === 'Y') ||
      (bidAction > -1 && bidAction < currentBidRank)
    ) && bidAction;
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
  scoreRound() {
    const bidTeamWins = this.bidTeamPoints >= this.bid.points;
    this.players.forEach((p, index) => p.score += this.scorePlayer(index, bidTeamWins));
    if (this.players.reduce((sum, player) => sum += player.score, 0) !== 0) {
      console.log('WARNING: scores do not sum to 0')
    }
  },
  endRound() {
    this.scoreRound();
    this.trick = null;
    this.lastTrick = null;
    this.rounds.push(this.players.map(p => p.tricks));
  }
});
