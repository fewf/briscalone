const { getPointsForCards, getSuit } = require("./cardUtils");

module.exports = game => {
  const round = game.loadRound();
  const { nextAction } = round;
  if (nextAction === "bid") {
    return computerBid(round);
  } else if (nextAction === "monkey") {
    return computerMonkey(round);
  } else {
    return computerThrow(round);
  }
};

function computerThrow(round) {
  const hand = round.playerHands[round.playerIndex];
  if (isNaN(round.monkeySuit)) {
    // avoid throwing monkey Suit if youre the bidder
    const cardPool =
      round.playerIndex === round.bidderIndex
        ? hand.filter(card => getSuit(card) !== computerMonkey(round))
        : hand.filter(card => getRank(card) !== round.bidRank);
    if (!cardPool.length) {
      // case where bidder has only monkey suit cards
      cardPool.concat(hand);
    }
    const cardRanks = cardPool.map(card => getRank(card));
    return cardPool[cardRanks.indexOf(Math.min(...cardRanks))];
  } else if (round.playerIndex === round.bidderIndex) {
    return computerBidderThrow(round);
  } else if (round.playerIndex === round.partnerIndex) {
    return computerPartnerThrow(round);
  } else {
    return computerDefenderThrow(round);
  }
}
function computerAnalysis(round) {
  const trickAnalysis = trickAnalysis(round);
  const handAnalysis = handAnalysis(round);

  const toThrows = trickAnalysis
    .filter(trickThrow => isNaN(trickThrow.card))
    .map(trickThrow => trickThrow.isTeammate);
  const weightedChanceTeammates = toThrows.reduce(
    (avg, item, index, arr) =>
      avg + (item / ((arr.length * (arr.length + 1)) / 2 - 1)) * index,
    0
  );
  return {
    trick: trick.round,
    throwerAnalysis: null
  };
}
function trickAnalysis(round) {
  const { playerIndex } = round;
  const throws = round.trick.length;
  const throwerAnalysis = throwerAnalysis(round);
  return [...Array(5).keys()].map(index => {
    const card = round.trick[index];
    const throwerIndex = (playerIndex + 5 - throws + index) % 5;
    return {
      card,
      throwerIndex,
      isTaking: round.resolveTrickWinner(round.trick) === throwerIndex,
      isTeammate: throwerAnalysis[index]
    };
  });
}
function getTrickCardValueFn(round) {
  // no purpose in checking led suit if its the same as monkey
  const ledSuit =
    getSuit(round.trick[0]) !== round.monkeySuit
      ? getSuit(round.trick[0])
      : undefined;
  return card =>
    (10 + (isNaN(ledSuit) ? 0 : 10)) * (getSuit(card) === round.monkeySuit) +
    10 * (getSuit(card) === ledSuit) +
    getRank(card);
}
function handAnalysis(round, trickAnalysis) {
  const takingCard = trickAnalysis.find(ta => ta.isTaking);
  const outstandingCards = [...Array(40).keys()].filter(
    card =>
      // card hasn't been played
      round.trickCards.indexOf(card) === -1 &&
      // player doesn't have card
      round.playerHands[round.playerIndex].indexOf(card) === -1
  );
  return round.playerHands[round.playerIndex].map((card, i) => {
    const cardValue = getTrickCardValueFn({
      ...round,
      trickCards: round.trickCards.concat([card])
    });
    const takingCardValue = cardValue(trickAnalysis.find(ta => ta.isTaking));
    const takes =
      round.resolveTrickWinner(round.trick.concat([card])) ===
      round.playerIndex;
    const value = cardValue(card);

    const outstandingTrickTakingCards = outstandingCards.filter(
      outstandingCard =>
        value < takingCardValue
          ? cardValue(outstandingCard) > takingCardValue
          : cardValue(outstandingCard) > value
    );

    return {
      card,
      value,
      takes,
      outstandingTrickTakingCards
    };
  });
}
function throwerAnalysis(round) {
  let ret;
  if (round.playerIndex === round.bidderIndex) {
    // bidder perspective
    if (round.bidderIndex === round.partnerIndex) {
      // bidder is own partner
      ret = [...Array(5)].map(index => 0);
    } else if (round.partnerIsRevealed) {
      // partner is revealed
      ret = [...Array(5).keys()].map(index =>
        Number(index === round.partnerIndex)
      );
    } else {
      // uncertain
      ret = [...Array(5).keys()].map(index => 0.25);
    }
  } else if (round.playerIndex === round.partnerIndex) {
    // partner perspective
    ret = [...Array(5).keys()].map(index =>
      Number(index === round.bidderIndex)
    );
  } else {
    // defender perspective
    if (round.partnerIsRevealed) {
      // partner is revealed
      ret = [...Array(5).keys()].map(index =>
        Number([round.partnerIndex, round.bidderIndex].indexOf(index) === -1)
      );
    } else {
      // uncertain
      ret = [...Array(5).keys()].map(index =>
        index === round.bidderIndex ? 0 : 1 / 3
      );
    }
  }
  ret[round.playerIndex] = 1;
  return ret;
}
function opponentTakesLast(round) {
  if (round.trick.length === 4) {
    return 0;
  } else if (round.playerIndex === round.bidderIndex) {
    return round.partnerIsRevealed
      ? Number((round.playerIndex + 1) % 5 === round.partnerIndex)
      : undefined;
  }
}
function computerBidderThrow(round) {
  if (round.partnerIsRevealed) {
  } else {
  }
}
function computerPartnerThrow(round) {}
function computerDefenderThrow(round) {}

function computerMonkey(round) {
  const hand = round.playerHands[round.playerIndex];
  const strength = previousTrickgetHandStrength(hand);
  return strength.suit;
}

function computerBid(round) {
  const { bidRank, bidPoints } = round;
  const hand = round.playerHands[round.playerIndex];
  const strength = previousTrickgetHandStrength(hand);
  const lowest = previousTrickgetLowestBidRank(strength.strength);
  let nextLowerBid = !round.bidActions.length ? 9 : bidRank - 1;
  if (bidRank === 0) {
    if (strength.strength > 10 && bidPoints < 75) {
      return "Y";
    } else if (strength.strength > 11 && bidPoints < 90) {
      return "Y";
    } else if (strength.strength > 12) {
      return "Y";
    } else {
      return "P";
    }
  } else {
    while (
      strength.strength < 10 &&
      hand.indexOf(Number(`${strength.suit}${nextLowerBid}`)) !== -1
    ) {
      nextLowerBid = nextLowerBid - 1;
    }
    if (nextLowerBid < lowest) {
      return "P";
    }
    return nextLowerBid;
  }
}

function getHandStrength(round, hand) {
  const suitStrengths = [...Array(4).keys()].map(suitNum =>
    hand
      .filter(card => getSuit(card) === suitNum)
      .reduce((strength, card) => strength + Math.pow(getRank(card) + 1, 3), 0)
  );
  // console.log(suitStrengths)
  const bestSuit = suitStrengths.indexOf(Math.max(...suitStrengths));
  // minimum of this routine is 54 (hence the subtraction) max is 9048
  return {
    strength:
      (suitStrengths.reduce(
        (total, suitStrength, index) =>
          total + (index === bestSuit ? suitStrength * 3 : suitStrength),
        0
      ) -
        54) /
      750,
    suit: bestSuit
  };
}
function getLowestBidRank(strength) {
  const ret = 10 - Math.round(strength);
  return ret < 0 ? 0 : ret;
}
