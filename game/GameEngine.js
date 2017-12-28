"use strict"

const shuffle = require('lodash/shuffle');
const random = require('lodash/random');
const sortBy = require('lodash/sortBy');
const flatten = require('lodash/flatten');
const prompt = require('prompt-sync')();

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
  players: [...Array(5).keys()].map(() => ({score: 0, tricks: []})),

  deal() {
    const cards = shuffle([...Array(40).keys()]).map(cardNum => this.getCard(cardNum));
    this.players.forEach(
      (player, i) => {
        player.cards = sortBy(
          cards.slice(i * 8, i * 8 + 8),
          ['suit', 'rank']
        );
        player.tricks = [];
      }
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

  resolveBid() {
    let playerIndex = this.getFirstPlayerIndex();
    let bidRank;
    let points = 61;
    let passes = 0;
    let final = false;
    while (!final) {
      console.log(`player ${playerIndex + 1}`)
      console.log(this.displayCards(this.players[playerIndex].cards))

      if (!this.rankOrder[bidRank]) {
        console.log('make the first bid');
      } else if (bidRank !== 0) {
        console.log(`you must bid lower than ${this.rankOrder[bidRank]}`);
      } else {
        console.log(`2 and ${points + 2} points? type Y`)
      }
      let resBid = prompt('your bid, please? ');
      console.log(resBid);
      if (this.rankOrder[bidRank] && resBid === 'P') {
        playerIndex = (playerIndex + 1) % 5;
        passes++;
        if (passes === 4) {
          final = true;
        }
      } else if (bidRank === 0 && resBid === 'Y') {
        points = points + 2;
        passes = 0;
        playerIndex = (playerIndex + 1) % 5;
        if (points === 119) {
          final = true;
        }
      } else {
        let rank = this.rankOrder.indexOf(resBid);
        if (rank === -1) {
          console.log('bad input');
        } else if (rank >= bidRank) {
          console.log('must be lower');
        } else {
          bidRank = rank;
          passes = 0;
          playerIndex = (playerIndex + 1) % 5;
        }
      }
    }
    console.log(`player ${playerIndex + 1} wins bid with ${this.rankOrder[bidRank]}`)
    this.bid = {
      points,
      bidderIndex: playerIndex,
      rank: bidRank
    };
  },

  getFirstPlayerIndex() {
    return (
      this.lastTrick && this.players.indexOf(
        this.players.find(
          player => player.tricks.indexOf(this.lastTrick) !== -1
        )
      )
    ) || this.rounds.length % 5;
  },

  getTrick() {
    const trick = this.trick = [];
    let playerIndex = this.getFirstPlayerIndex();
    while (trick.length < 5) {
      console.log(`player ${playerIndex + 1}`)
      console.log(this.displayCards(this.players[playerIndex].cards));
      let resCard = prompt('throw a card: ');
      while(isNaN(resCard) || resCard < 1 || resCard > this.players[playerIndex].cards.length) {
        console.log('err');
        resCard = prompt('throw a card: ');
      }
      trick.push(
        this.players[playerIndex].cards.splice(resCard - 1, 1)[0]
      );

      console.log(this.displayCards(trick));
      playerIndex = (playerIndex + 1) % 5;
    }
    if (!this.suitOrder[this.bid.suit]) {
      console.log('please announce trump');
      const bidder = this.players[this.bid.bidderIndex];

      console.log(`player ${this.bid.bidderIndex + 1}`)
      console.log(this.displayCards(bidder.cards));
      let resSuit = prompt('pick a trump suit: ');
      while (this.suitOrder.indexOf(resSuit) === -1) {
        console.log('err');
        resSuit = prompt('pick a trump suit: ');
      }
      this.bid.suit = this.suitOrder.indexOf(resSuit);
      const partnerCard = this.bid.suit * 10 + this.bid.rank;
      const partner = this.players.find(
        (player, i) => player.cards.concat(
          [trick[(this.getFirstPlayerIndex() + i) % 5]]
        ).map(card => card.cardNum).indexOf(partnerCard) !== -1
      )
      console.log(`partner is player ${this.players.indexOf(partner) + 1}`)
      console.log(this.displayCards(partner.cards));
      this.bid.partnerIndex = this.players.indexOf(partner);
    }
    const winner = this.resolveTrickWinner(trick);
    winner.tricks.push(trick);
    console.log(`player ${this.players.indexOf(winner) + 1} takes trick`)
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
    const index = trick.indexOf(winner);
    return this.players[(this.getFirstPlayerIndex() + index) % 5];
  },

  getBidTeamPoints() {
    const trickCards = flatten(
      this.players[this.bid.bidderIndex].tricks.concat(
        this.bid.bidderIndex !== this.bid.partnerIndex
        ? this.players[this.bid.partnerIndex].tricks
        : []
      )
    );
    return this.getPointsForCards(trickCards);
  },

  getDefendTeamPoints() {
    const trickCards = flatten(flatten(this.players.filter(
      (p, i) => [this.bid.bidderIndex, this.bid.partnerIndex].indexOf(i) === -1
    ).map(p => p.tricks)));
    return this.getPointsForCards(trickCards);
  },
  bidderIsPartner() {
    return this.bid.bidderIndex === this.bid.partnerIndex;
  },
  isBidTeam(playerIndex) {
    return [this.bid.bidderIndex, this.bid.partnerIndex].indexOf(playerIndex) !== -1;
  },
  scorePlayer(playerIndex, bidTeamWins) {
    return (
      this.isBidTeam(playerIndex) === bidTeamWins
      ? 1
      : -1
    ) * (
      playerIndex === this.bid.bidderIndex
      ? this.bidderIsPartner() ? 4 : 2
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
    while (!this.players.filter(player => player.score >= 3).length) {
      this.deal()
      this.resolveBid()
      // this.players[3].bid = 4
      while (this.players[0].cards.length) {
        this.getTrick()
        console.log(this.players)
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
