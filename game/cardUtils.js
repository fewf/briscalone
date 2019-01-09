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

module.exports = {
  getPoints,
  getPointsForCards,
  getSuit,
  getRank
}
