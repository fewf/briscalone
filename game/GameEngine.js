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
        } else if (this.trickCards.length % 5 === 0 || isNaN(this.monkeySuit)) {
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
        return this.playerHandsDealt.findIndex(
          hand => hand.indexOf(this.partnerCard) !== -1
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
      get nextAction() {
        if (!this.bidIsFinal) {
          return 'bid';
        } else if (this.trickCards.length === 5 && isNaN(this.monkeySuit)) {
          return 'monkey';
        } else {
          return 'throw';
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
        return this.getPointsForCards(flatten(this.bidTeamTricks));
      },
      get defendTeamPoints() {
        return this.getPointsForCards(flatten(this.defendTeamTricks));
      },
      get ledSuit() {
        return this.trick && this.getSuit(this.trick[0]);
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
            : this.getSuit(cardNum) === this.ledSuit
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
  },

  // computer player functions

  computerPlay() {
    const round = this.loadRound();
    const {nextAction} = round;
    if (nextAction === 'bid') {
      return this.computerBid(round);
    } else if (nextAction === 'monkey') {
      return this.computerMonkey(round);
    } else {
      return this.computerThrow(round);
    }
  },

  computerThrow(round) {
    const hand = round.playerHands[round.playerIndex];
    if (isNaN(round.monkeySuit)) {
      // avoid throwing monkey Suit if youre the bidder
      const cardPool = (
        round.playerIndex === round.bidderIndex
        ? hand.filter(card => round.getSuit(card) !== this.computerMonkey(round))
        : hand.filter(card => round.getRank(card) !== round.bidRank)
      );
      if (!cardPool.length) {
        // case where bidder has only monkey suit cards
        cardPool.concat(hand);
      }
      const cardRanks = cardPool.map(card => round.getRank(card));
      return cardPool[cardRanks.indexOf(Math.min(...cardRanks))];
    } else if (round.playerIndex === round.bidderIndex) {
      return this.computerBidderThrow(round);
    } else if (round.playerIndex === round.partnerIndex) {
      return this.computerPartnerThrow(round);
    } else {
      return this.computerDefenderThrow(round);
    }
  },
  computerAnalysis(round) {
    const trickAnalysis = this.trickAnalysis(round);
    const handAnalysis = this.handAnalysis(round);

    const toThrows = trickAnalysis.filter(
      trickThrow => isNaN(trickThrow.card)
    ).map(trickThrow => trickThrow.isTeammate);
    const weightedChanceTeammates = toThrows.reduce(
      (avg, item, index, arr) => avg + (
        (item / (arr.length * (arr.length + 1) / 2 -1)) * index
      ),
      0
    );
    return {
      trick: trick.round,
      throwerAnalysis: null
    }
  },
  trickAnalysis(round) {
    const {playerIndex} = round;
    const throws = round.trick.length;
    const throwerAnalysis = this.throwerAnalysis(round);
    return [...Array(5).keys()].map(index => {
      const card = round.trick[index];
      const throwerIndex = (playerIndex + 5 - throws + index) % 5;
      return {
        card,
        throwerIndex,
        isTaking: round.resolveTrickWinner(round.trick) === throwerIndex,
        isTeammate: throwerAnalysis[index]
      }
    });
  },
  getTrickCardValueFn(round) {
    // no purpose in checking led suit if its the same as monkey
    const ledSuit = (
      round.getSuit(round.trick[0]) !== round.monkeySuit
      ? round.getSuit(round.trick[0])
      : undefined
    )
    return card => (
      ((10 + (isNaN(ledSuit) ? 0 : 10)) * (round.getSuit(card) === round.monkeySuit)) +
      (10 * (round.getSuit(card) === ledSuit)) +
      round.getRank(card)
    )
  },
  handAnalysis(round, trickAnalysis) {
    const takingCard = trickAnalysis.find(ta => ta.isTaking);
    const outstandingCards = [...Array(40).keys()].filter(
      card => (
        // card hasn't been played
        round.trickCards.indexOf(card) === -1 &&
        // player doesn't have card
        round.playerHands[round.playerIndex].indexOf(card) === -1
      )
    );
    return round.playerHands[round.playerIndex].map((card, i) => {
      const cardValue = this.getTrickCardValueFn(
        this.loadRound({
          ...this.roundData,
          trickCards: this.roundData.trickCards.concat([card])
        })
      )
      const takingCardValue = cardValue(trickAnalysis.find(ta => ta.isTaking));
      const takes = round.resolveTrickWinner(round.trick.concat([card])) === round.playerIndex;
      const value = cardValue(card);

      const outstandingTrickTakingCards = outstandingCards.filter(
        outstandingCard => (
          value < takingCardValue
          ? cardValue(outstandingCard) > takingCardValue
          : cardValue(outstandingCard) > value
        )
      );

      return {
        card,
        value,
        takes,
        outstandingTrickTakingCards
      }
    });
  },
  throwerAnalysis(round) {
    let ret;
    if (round.playerIndex === round.bidderIndex) {
      // bidder perspective
      if (round.bidderIndex === round.partnerIndex) {
        // bidder is own partner
        ret = [...Array(5)].map(index => 0);
      } else if (round.partnerIsRevealed) {
        // partner is revealed
        ret = [...Array(5).keys()].map(
          index => Number(index === round.partnerIndex)
        );
      } else {
        // uncertain
        ret = [...Array(5).keys()].map(
          index => 0.25
        );
      }
    } else if (round.playerIndex === round.partnerIndex) {
      // partner perspective
      ret = [...Array(5).keys()].map(
        index => Number(index === round.bidderIndex)
      );
    } else {
      // defender perspective
      if (round.partnerIsRevealed) {
        // partner is revealed
        ret = [...Array(5).keys()].map(
          index => Number([round.partnerIndex, round.bidderIndex].indexOf(index) === -1)
        );
      } else {
        // uncertain
        ret = [...Array(5).keys()].map(
          index => index === round.bidderIndex ? 0 : 1 / 3
        )
      }
    }
    ret[round.playerIndex] = 1;
    return ret;
  },
  opponentTakesLast(round) {
    if (round.trick.length === 4) {
      return 0;
    } else if (round.playerIndex === round.bidderIndex) {
      return (
        round.partnerIsRevealed
        ? Number((round.playerIndex + 1) % 5 === round.partnerIndex)
        : undefined
      )
    }
  },
  computerBidderThrow(round) {
    if (round.partnerIsRevealed) {

    } else {

    }
  },
  computerPartnerThrow(round) {

  },
  computerDefenderThrow(round) {

  },

  computerMonkey(round) {
    const hand = round.playerHands[round.playerIndex];
    const strength = this.getHandStrength(hand);
    return strength.suit;
  },

  computerBid(round) {
    const {bidRank, bidPoints} = round;
    const hand = round.playerHands[round.playerIndex];
    const strength = this.getHandStrength(hand);
    const lowest = this.getLowestBidRank(strength.strength);
    let nextLowerBid = !round.bidActions.length ? 9 : bidRank - 1;
    if (bidRank === 0) {
      if (strength.strength > 10 && bidPoints < 75) {
        return 'Y';
      } else if (strength.strength > 11 && bidPoints < 90) {
        return 'Y';
      } else if (strength.strength > 12) {
        return 'Y';
      } else {
        return 'P';
      }
    } else {
      while (strength.strength < 10 && hand.indexOf(Number(`${strength.suit}${nextLowerBid}`)) !== -1) {
        nextLowerBid = nextLowerBid - 1;
      }
      if (nextLowerBid < lowest) {
        return 'P';
      }
      return nextLowerBid;
    }

  },

  getHandStrength(hand) {
    const round = this.loadRound();
    const suitStrengths = [...Array(4).keys()].map(
      suitNum => hand.filter(
        card => round.getSuit(card) === suitNum
      ).reduce(
        (strength, card) => strength + Math.pow(round.getRank(card) + 1, 3),
        0
      )
    );
    // console.log(suitStrengths)
    const bestSuit = suitStrengths.indexOf(Math.max(...suitStrengths));
    // minimum of this routine is 54 (hence the subtraction) max is 9048
    return {
      strength: (suitStrengths.reduce(
        (total, suitStrength, index) => total + (
          index === bestSuit
          ? suitStrength * 3
          : suitStrength
        ),
        0
      ) - 54) / 750,
      suit: bestSuit
    };
  },
  getLowestBidRank(strength) {
    const ret = 10 - Math.round(strength);
    return ret < 0 ? 0 : ret;
  }
});
