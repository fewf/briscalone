"use strict"

const shuffle = require('lodash/shuffle');
const random = require('lodash/random');
const sortBy = require('lodash/sortBy');
const flatten = require('lodash/flatten');
const dropRightWhile = require('lodash/dropRightWhile');
// clockwork of game
// tricks: [], bids: [] => initial state
// tricks: [], bids: [{bidActions: [], suit: undefined}] => round 1 has begun
// tricks: [], bids: [{bidActions: [9, 'P', ], suit: undefined}] => round 1 bidding is underway
// tricks: [[]], bids: [{bidActions: [9, 'P', 'P', 'P', 'P'], suit: undefined}] => round 1 bidding is final
// tricks: [[{cardNum: 0, rank: 0, suit: 0}]], bids:[{''}] => round 1 trick 1 is underway
// tricks: [[{cardNum: 0, rank: 0, suit: 0}, {...}, {...}, {...}, {...}]], bids:[{''}] => round 1 trick 1 is underway
module.exports = (state = {}) => ({
  rounds: [],
  // properties
  initializeRound() {
    const game = this;
    this.round.push({
      bid: {
        // keeps track of bid responses
        // each item can be: rank, P for pass or Y for point bid]
        bidActions: [],
        // records monkey suit
        suit: undefined,

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
      },
      tricks: this.tricks.slice(roundIndex * 8, (roundIndex + 1) * 8),
      shuffle: shuffle([...Array(40).keys()]),
      get players() {
        const round = this;
        return [...Array(5).keys()].map(i => ({
          hand: round.shuffle.slice(i * 8, (i + 1) * 8),
          get cards() {
            return this.hand && this.hand.filter(
              cardNum => round.trickCards.indexOf(cardNum) === -1
            ).map(game.getCard.bind(game))
          }
        }))
      },
      get trick() {
        return this.tricks[this.tricks.length - 1];
      },
      get lastTrick() {
        return this.tricks[this.tricks.length - 2];
      },

      get trickCards() {
        return flatten(this.tricks);
      },
      // index position of bidder in this.players
      get bidderIndex() {
        if (!this.bid || !this.bid.isFinal) {
          return null;
        }
        const ignoreEndPasses = dropRightWhile(
          this.bid.bidActions,
          ba => ba === 'P'
        );
        return (this.roundFirstPlayerIndex + ignoreEndPasses.length - 1) % 5;
      },
      // index position of partner in this.players
      get partnerIndex() {
        if (!this.bid || isNaN(this.bid.suit)) {
          return null;
        }
        const partnerCardNum = this.bid.suit * 10 + this.bid.rank;
        return this.getPlayerIndexDealt(partnerCardNum);
      },

      get roundFirstPlayerIndex() {
        return this.bids.length % 5;
      },


      get playerIndex() {
        if (!this.bid || !this.bid.bidActions.length) {
          return this.roundFirstPlayerIndex;
        } else if (this.trick && this.trick.length === 5 && isNaN(this.bid.suit)) {
          return this.bidderIndex;
        }
        let preModulo;
        if (this.lastTrick) {
          preModulo = this.resolveTrickWinner(this.lastTrick) + this.trick.length;
        } else {
          const auger = this.bid.isFinal ? this.trick : this.bid.bidActions;
          preModulo = this.roundFirstPlayerIndex + auger.length
        }
        return preModulo % 5;
      },

      get bidderIsPartner() {
        return this.bidderIndex === this.partnerIndex;
      },

      get bidTeamPoints() {
        if (!this.bid) {
          return null;
        }
        const bidTeamTricks = this.round.tricks.filter(
          trick => [this.bidderIndex, this.partnerIndex].indexOf(
            this.resolveTrickWinner(trick)
          ) !== -1
        );
        return this.getPointsForCards(flatten(bidTeamTricks));
      },

      get defendTeamPoints() {
        if (!this.bid) {
          return null;
        }
        const defendTeamTricks = this.round.tricks.filter(
          trick => [this.bidderIndex, this.partnerIndex].indexOf(
            this.resolveTrickWinner(trick)
          ) === -1
        );
        return this.getPointsForCards(flatten(bidTeamTricks));
      }
    },

    getPlayerIndexDealt(cardNum) {
      return this.players.findIndex(
        (player, i) => player.hand.indexOf(cardNum) !== -1
      );
    },

    getPlayerIndexHolding(cardNum) {
      return this.players.findIndex(
        (player, i) => player.cards.map(card => card.cardNum).indexOf(cardNum) !== -1
      );
    });
  },

  // card utils


  getSuit(cardNum) {
    return Math.floor(cardNum / 10);
  },

  getRank(cardNum) {
    return cardNum % 10;
  },

  getPoints(cardNum) {
    const rank = this.getRank(cardNum);
    return rank < 5 ? 0 : [2, 3, 4, 10, 11][rank - 5];
  },

  getPointsForCards(cards) {
    return cards.reduce((total, card) => total + this.getPoints(card), 0);
  },

  getCard(cardNum) {
    return {
      rank: this.getRank(cardNum),
      suit: this.getSuit(cardNum),
      cardNum
    };
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
    if (isNaN(this.bid.suit)) {
      throw('Briscalone Error: cannot resolve trick winner before suit is set.');
    }
    const trickCards = trick.map(cardNum => this.getCard(cardNum));
    let winner = trickCards[0];
    let contender;
    for (var i = 1; i < trickCards.length; i++) {
      contender = trickCards[i];
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
    return this.getPlayerIndexDealt(winner.cardNum);
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

  // state changing functions
  initializePlayers() {
    const game = this;
    this.players = [...Array(5).keys()].map(() => ({
      score: 0,
      get cards() {
        return this.hand && this.hand.filter(
          cardNum => game.trickCards.indexOf(cardNum) === -1
        ).map(this.getCard.bind(this))
      }
    }))
  },
  deal() {
    const cards = shuffle([...Array(40).keys()]);
    this.players = this.players.map(
      (player, i) => Object.assign(
        player,
        {
          hand: sortBy(
            cards.slice(i * 8, i * 8 + 8),
            [card => this.getSuit(card), card => this.getRank(card)]
          ),
        }
      )
    );
  },

  pushBidAction(bidAction) {
    this.bid.bidActions.push(bidAction);
  },


  setSuit(suit) {
    this.bid.suit = suit;
    this.endTrick();
  },

  pushTrickCard(trickCardNum) {
    if (this.getPlayerIndexWithCardNum(trickCardNum) !== this.playerIndex) {
      return false;
    }

    if (this.trick.push(trickCardNum) === 5 && !isNaN(this.bid.suit)) {
      this.endTrick();
    }
    return true;
  },

  endTrick() {
    if (!this.players[0].cards.length) {
      this.endRound();
    }
  },
  ...state
});
