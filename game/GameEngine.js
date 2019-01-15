"use strict"

const {
  getPointsForCards,
  getSuit
} = require('./cardUtils');
const shuffle = require('lodash/shuffle');
const flatten = require('lodash/flatten');
const dropRightWhile = require('lodash/dropRightWhile');
const range = require('lodash/range');

const PASS_BID = 'P';
const POINT_BID = 'Y';
const BID = 'bid';
const THROW = 'throw';
const MONKEY = 'monkey';

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
        const onlyPointBids = this.bidActions.filter(ba => ba === POINT_BID);
        return onlyPointBids.length * 2 + 61;
      },
      get bidIsFinal() {
        // bid is final if the points have been incremented to 119
        // or the last 4 bid actions are passes
        return this.bidPoints === 119 || this.bidActions.slice(
          this.bidActions.length - 4,
          this.bidActions.length
        ).filter(ba => ba === PASS_BID).length === 4;
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
        if (!this.bidIsFinal) return ret;
        const copy = [...this.trickCards];
        while (copy.length) {
          ret.push(copy.splice(0, 5));
        }
        // initialize empty trick if conditions right
        if (!ret[0] || (ret[ret.length - 1].length === 5 && this.monkeySuit)) ret.push([]);
        return ret;
      },
      get trick() {
        return this.tricks.pop();
      },
      get previousTrick() {
        if (isNaN(this.monkeySuit)) {
          return undefined;
        } else {
          return this.tricks[this.tricks.length - 2];
        }
      },
      // index position of bidder in this.players

      get bidderIndex() {
        if (!this.bidActions.length) return null;
        const ignoreEndPasses = dropRightWhile(
          this.bidActions,
          ba => ba === PASS_BID
        );
        return (this.roundFirstPlayerIndex + ignoreEndPasses.length - 1) % 5;
      },
      // index position of partner in this.players
      get partnerIndex() {
        if (isNaN(this.monkeySuit)) {
          return null;
        }
        return this.playerHandsDealt.findIndex(
          hand => hand.indexOf(this.partnerCard) !== -1
        );
      },

      get playerIndex() {
        let premodulo;
        if (!this.bidIsFinal) {
          premodulo = this.roundFirstPlayerIndex + this.bidActions.length;
        } else if (this.nextAction == MONKEY) {
          premodulo = this.bidderIndex;
        } else {
          premodulo = this.trickFirstPlayerIndex + this.trickCards.length;
        }
        return premodulo % 5;
      },

      get trickFirstPlayerIndex() {
        if (!this.previousTrick) {
          return this.roundFirstPlayerIndex;
        } else {
          return this.resolveTrickWinner(this.previousTrick);
        }
      },
      get nextAction() {
        if (!this.bidIsFinal) {
          return BID;
        } else if (this.trickCards.length === 5 && isNaN(this.monkeySuit)) {
          return MONKEY;
        } else {
          return THROW;
        }
      },

      get bidderIsPartner() {
        return this.bidderIndex === this.partnerIndex;
      },

      get partnerIsRevealed() {
        return this.trickCards.indexOf(this.partnerCard) !== -1;
      },

      get partnerCard() {
        return this.monkeySuit * 10 + this.bidRank;
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
        return getPointsForCards(flatten(this.bidTeamTricks));
      },
      get defendTeamPoints() {
        return getPointsForCards(flatten(this.defendTeamTricks));
      },
      get ledSuit() {
        return this.trick && getSuit(this.trick[0]);
      },
      get bidTeamWins() {
        if (!this.isFinal) {
          return null;
        }
        return this.bidTeamPoints >= this.bidPoints;
      },
      get roundScore() {
        if (!this.isFinal) {
          return [0, 0, 0, 0, 0];
        }

        return range(5).map(playerIndex => this.scorePlayer(playerIndex));
      },
      playerTricks(playerIndex) {
        return this.tricks.filter(
          trick => trick.length === 5 && this.resolveTrickWinner(trick) === playerIndex
        )
      },
      playerPointsTaken(playerIndex) {
        return getPointsForCards(flatten(this.playerTricks(playerIndex)));
      },
      validateBidAction(bidAction) {
        const currentBidRank = this.bidRank;
        return (
          (this.bidActions.length && bidAction === PASS_BID) ||
          (currentBidRank === 0 && bidAction === POINT_BID) ||
          (bidAction > -1 && bidAction < currentBidRank)
        ) && bidAction;
      },

      resolveTrickWinner(trick) {
        if (isNaN(this.monkeySuit)) {
          return -1;
        }
        const leadingSuit = getSuit(trick[0]);
        const cardValues = trick.map(
          cardNum => (
            getSuit(cardNum) === this.monkeySuit
            ? 1000 + cardNum
            : getSuit(cardNum) === this.ledSuit
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
      scorePlayer(playerIndex) {
        return (
          this.isBidTeam(playerIndex) === this.bidTeamWins
          ? 1
          : -1
        ) * (
          playerIndex === this.bidderIndex
          ? this.bidderIsPartner ? 4 : 2
          : 1
        );
      },
      ...roundData
    };
  },

  get roundData() {
    return this.rounds[this.rounds.length - 1];
  },

  get roundScores() {
    return this.rounds.map(
      roundData => {
        const round = this.loadRound(roundData);
        return round.roundScore;
      }
    );
  },

  get gameScore() {
    const {roundScores} = this;
    return [...Array(5).keys()].map(idx =>
      [...Array(roundScores.length).keys()].reduce(
        (sum, idx2) => sum + roundScores[idx2][idx],
        0
      )
    )
  },
  // state changers
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
