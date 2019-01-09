function getPoints(cardNum) {
  const rank = getRank(cardNum);
  return rank < 5 ? 0 : [2, 3, 4, 10, 11][rank - 5];
};

function getPointsForCards(cards) {
  return cards.reduce((total, card) => total + getPoints(card), 0);
};

function getSuit(cardNum) {
  return Math.floor(cardNum / 10);
};

function getRank(cardNum) {
  return cardNum % 10;
};

function getCardUnicode(cardNum) {
  const suitChar = [12, 10, 11, 13][getSuit(cardNum)] * 16;
  const rankChar = [2, 3, 4, 5, 6, 11, 13, 14, 10, 1][getRank(cardNum)];

  return String.fromCodePoint(
    0xd83c,
    0xdc00 + suitChar + rankChar
  );
}

module.exports = {
  getPoints,
  getPointsForCards,
  getSuit,
  getRank,
  getCardUnicode
}
