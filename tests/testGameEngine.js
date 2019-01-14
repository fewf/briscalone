const GameEngine = require('../game/GameEngine');

function assertTrue(assertion) {
  if (assertion) {
    console.log('pass');
  } else {
    console.trace();
    throw('Assertion not true');
  }
}

let game = GameEngine();
game.initializeRound();
let round = game.loadRound();

assertTrue(round);
assertTrue(round.bidRank === Number.POSITIVE_INFINITY);
assertTrue(round.bidPoints === 61);
assertTrue(!round.bidIsFinal);
assertTrue(round.playerHands.length === 5)
assertTrue(round.playerHands[0].length === 8)
assertTrue(round.playerHandsDealt.length === 5)
assertTrue(round.playerHandsDealt[0].length === 8)
assertTrue(round.tricks.length === 0)
assertTrue(round.trick === undefined)
assertTrue(round.lastTrick === undefined)
assertTrue(round.bidderIndex === null)
assertTrue(round.partnerIndex === null)
assertTrue(round.playerIndex === 0)
assertTrue(round.bidderIsPartner === true)
assertTrue(round.bidTeamPoints === 0)
assertTrue(round.defendTeamPoints === 0)


game = GameEngine();
game.initializeRound({
  trickCards: [],
  shuffle: [...Array(40).keys()],
// hands like [0,1,2,3,4,5,6,7] [8,9,10,11,12,13,14,15]...
  bidActions: [],
  monkeySuit: undefined
});
round = game.loadRound();
assertTrue(round.playerHands[0].join('') === '01234567');
assertTrue(round.playerHands[1].join('') === '89101112131415');
assertTrue(round.playerHands[2].join('') === '1617181920212223');
assertTrue(round.playerHands[3].join('') === '2425262728293031');
assertTrue(round.playerHands[4].join('') === '3233343536373839');
// assert it doesn't let you pass first
assertTrue(!game.pushBidAction('P'));
assertTrue(game.pushBidAction(9));
assertTrue(round.bidActions.length === 1 && round.bidActions[0] === 9)
assertTrue(game.pushBidAction(7));
assertTrue(!game.pushBidAction(8));
assertTrue(game.pushBidAction(5));
assertTrue(game.pushBidAction(3));
assertTrue(game.pushBidAction(1));
assertTrue(game.pushBidAction('P'));
assertTrue(game.pushBidAction('P'));
assertTrue(game.pushBidAction('P'));
assertTrue(game.pushBidAction(0));
assertTrue(game.pushBidAction('Y'));
assertTrue(game.pushBidAction('P'));
assertTrue(game.pushBidAction('P'));
assertTrue(game.pushBidAction('P'));
assertTrue(game.pushBidAction('Y'));
assertTrue(game.pushBidAction('Y'));
assertTrue(game.pushBidAction('P'));
assertTrue(game.pushBidAction('P'));
assertTrue(game.pushBidAction('P'));
assertTrue(game.pushBidAction('P'));

assertTrue(round.bidIsFinal);
assertTrue(round.bidPoints === 67);
assertTrue(round.bidderIndex === 4);
assertTrue(round.partnerIndex === null);
assertTrue(round.playerIndex === 0);
assertTrue(round.trick.length === 0)

assertTrue(game.pushTrickCard(1))
assertTrue(!game.pushTrickCard(39))
assertTrue(JSON.stringify(round.trick) === JSON.stringify([1]))
assertTrue(round.playerIndex === 1);
assertTrue(game.pushTrickCard(11))
assertTrue(JSON.stringify(round.trick) === JSON.stringify([1, 11]))

assertTrue(game.pushTrickCard(21));
assertTrue(game.pushTrickCard(31));
assertTrue(round.trick.length === 4)
assertTrue(game.pushTrickCard(32));
assertTrue(round.playerIndex === 4);
assertTrue(round.trick.length === 5)
round = game.setSuit(3);
assertTrue(round.trick.length === 0)
assertTrue(round);
assertTrue(round.resolveTrickWinner(round.tricks[0]) === 4);
assertTrue(round.playerIndex === 4);
assertTrue(round.partnerIndex === 3);

while(round.playerHands[round.playerIndex].length) {
  assertTrue(game.pushTrickCard(round.playerHands[round.playerIndex][0]));
}
round = game.loadRound();
assertTrue(round.bidTeamPoints === 120)
assertTrue(round.defendTeamPoints === 0)
