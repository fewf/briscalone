"use strict"

const shuffle = require('lodash/shuffle');
const random = require('lodash/random');
const flatten = require('lodash/flatten');
const dropRightWhile = require('lodash/dropRightWhile');

module.exports = (rounds = []) => ({
  rounds,
  initializeRound(roundData) {
    this.rounds.push({
      trickCards: [],
      shuffle: shuffle([...Array(40).keys()]),
      bidActions: [],
      monkeySuit: undefined,
      ...roundData
    });
  },
  loadRound(roundData) {
    if (roundData === undefined) {
      roundData = this.roundData;
    }
    return {
      // this counts on the chance of two decks shuffled identically
      // being infinitessimally small.
      roundFirstPlayerIndex: this.rounds.findIndex(
        rnd => JSON.stringify(rnd.shuffle) === JSON.stringify(roundData.shuffle)
      ) % 5,
      get isFinal() {
        return this.trickCards.length === this.shuffle.length;
      },
      get bidRank() {
        if (!this.bidActions.length) {
          return Number.POSITIVE_INFINITY;
        }
        const onlyRanks = this.bidActions.filter(ba => !isNaN(ba));
        return onlyRanks[onlyRanks.length - 1];
      },
      get bidPoints() {
        const onlyYs = this.bidActions.filter(ba => ba === 'Y');
        return onlyYs.length * 2 + 61;
      },
      get bidIsFinal() {
        // bid is final if the points have been incremented to 119
        // or the last 4 bid actions are passes
        return this.points === 119 || this.bidActions.slice(
          this.bidActions.length - 4,
          this.bidActions.length
        ).filter(ba => ba === 'P').length === 4;
      },
      get playerHands() {
        const ret = this.playerHandsDealt.map(cards => cards.filter(
            cardNum => this.trickCards.indexOf(cardNum) === -1
          )
        );
        return ret;
      },
      get playerHandsDealt() {
        return [...Array(5).keys()].map(i => this.shuffle.slice(i * 8, (i + 1) * 8));
      },
      get tricks() {
        const ret = [];
        const copy = [...this.trickCards];
        while (copy.length) {
          ret.push(copy.splice(0, 5));
        }
        return ret;
      },
      get trick() {
        if (!this.bidIsFinal) {
          return undefined;
        } else if (this.trickCards % 5 === 0) {
          return [];
        } else {
          return this.tricks[this.tricks.length - 1];
        }
      },
      get lastTrick() {
        if (isNaN(this.monkeySuit)) {
          return undefined;
        } else if (this.trickCards.length % 5 === 0) {
          return this.tricks[this.tricks.length - 1];
        } else {
          return this.tricks[this.tricks.length - 2];
        }
      },
      // index position of bidder in this.players
      get bidderIndex() {
        if (!this.bidIsFinal) {
          return null;
        }
        const ignoreEndPasses = dropRightWhile(
          this.bidActions,
          ba => ba === 'P'
        );
        return (this.roundFirstPlayerIndex + ignoreEndPasses.length - 1) % 5;
      },
      // index position of partner in this.players
      get partnerIndex() {
        if (isNaN(this.monkeySuit)) {
          return null;
        }
        const partnerCardNum = this.monkeySuit * 10 + this.bidRank;
        return this.playerHandsDealt.findIndex(
          hand => hand.indexOf(partnerCardNum) !== -1
        );
      },

      get playerIndex() {
        let premodulo;
        if (!this.bidIsFinal) {
          premodulo = this.roundFirstPlayerIndex + this.bidActions.length;
        } else if (this.trickCards.length === 5 && isNaN(this.monkeySuit)) {
          premodulo = this.bidderIndex;
        } else if (!this.lastTrick) {
          premodulo = this.roundFirstPlayerIndex + this.trickCards.length;
        } else {
          premodulo = this.resolveTrickWinner(this.lastTrick)  + this.trickCards.length;
        }
        return premodulo % 5;
      },

      get bidderIsPartner() {
        return this.bidderIndex === this.partnerIndex;
      },

      get bidTeamTricks() {
        return this.tricks.filter(
          trick => [this.bidderIndex, this.partnerIndex].indexOf(
            this.resolveTrickWinner(trick)
          ) !== -1
        );
      },
      get defendTeamTricks() {
        return this.tricks.filter(
          trick => [this.bidderIndex, this.partnerIndex].indexOf(
            this.resolveTrickWinner(trick)
          ) === -1
        );
      },
      get bidTeamPoints() {
        return this.getPointsForCards(flatten(this.bidTeamTricks));
      },
      get defendTeamPoints() {
        return this.getPointsForCards(flatten(this.defendTeamTricks));
      },
      validateBidAction(bidAction) {
        const currentBidRank = this.bidRank;
        return (
          (this.bidActions.length && bidAction === 'P') ||
          (currentBidRank === 0 && bidAction === 'Y') ||
          (bidAction > -1 && bidAction < currentBidRank)
        ) && bidAction;
      },

      resolveTrickWinner(trick) {
        if (isNaN(this.monkeySuit)) {
          throw('Briscalone Error: cannot resolve trick winner before suit is set.');
        }
        const leadingSuit = this.getSuit(trick[0]);
        const cardValues = trick.map(
          cardNum => (
            this.getSuit(cardNum) === this.monkeySuit
            ? 1000 + cardNum
            : this.getSuit(cardNum) === leadingSuit
            ? 100 + cardNum
            : cardNum
          )
        );
        return this.playerHandsDealt.findIndex(
          hand => hand.indexOf(
            trick[cardValues.indexOf(Math.max(...cardValues))]
          ) !== -1
        );
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

      getPoints(cardNum) {
        const rank = this.getRank(cardNum);
        return rank < 5 ? 0 : [2, 3, 4, 10, 11][rank - 5];
      },

      getPointsForCards(cards) {
        return cards.reduce((total, card) => total + this.getPoints(card), 0);
      },
      getSuit(cardNum) {
        return Math.floor(cardNum / 10);
      },

      getRank(cardNum) {
        return cardNum % 10;
      },

      getCard(cardNum) {
        return {
          suit: this.getSuit(cardNum),
          rank: this.getRank(cardNum),
          cardNum
        };
      },
      ...roundData
    };
  },

  get roundData() {
    return this.rounds[this.rounds.length - 1];
  },
  get score() {
    let ret = Array(5).fill(0);
  },
  // card utils
  pushBidAction(bidAction) {
    const {roundData} = this;
    const round = this.loadRound(roundData);
    if (round.validateBidAction(bidAction) !== false) {
      roundData.bidActions.push(bidAction);
      return this.loadRound(roundData);
    } else {
      return false;
    }
  },


  setSuit(suit) {
    const {roundData} = this;
    if (!isNaN(roundData.monkeySuit)) {
      return false;
    }
    roundData.monkeySuit = suit;
    return this.loadRound(roundData);
  },

  pushTrickCard(trickCardNum) {
    const {roundData} = this;
    const round = this.loadRound(roundData);
    if (round.playerHands[round.playerIndex].indexOf(trickCardNum) === -1) {
      return false;
    }
    roundData.trickCards.push(trickCardNum)
    return this.loadRound(roundData);
  }
});
