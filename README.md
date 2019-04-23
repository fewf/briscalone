To run:
```
npm install
npm run build
npm start
```

_open browser and load 5 tabs at localhost:5000_

To run Cypress tests:
```
npm install
npm run build
node index.js --test
npm run cypress:open
```

_use cypress gui to run tests_

To run unit tests:
```
npm install
node tests/testGameEngine.js
```

_Note: because reasons, the word "trump"--as in "trump suit"--will not be used. The word "monkey" will be used instead._

- [The Game Engine](#the-game-engine)
- [The Game Itself](#the-game-itself)

### The Game Engine

Cards are represented as a 2-digit number between 00-39, the digit in the ones column represents the rank of the card (9 is Ace, 0 is Two) and the digit in the tens column represents the suit.

A game is an object containing array of `rounds`, where each round has the following attributes:

`shuffle`: the numbers 0-39 randomly shuffled. The first 8 cards belong to the first player, the next 8 belong to the second player and so forth

`trickCards`: initially an empty array, it will represent the cards played throughout the game

`bidActions`: initially an empty array, it will represent players' bids

`monkeySuit`: initially undefined, it will eventually be a number between 0-3 representing the monkey suit

The game begins with the bidding round. Players in turn bid a rank of a card (represented as 0-9 pushed onto the `bidActions` array), starting high and going lower with each subsequent bid. A player may pass, declining to bid, indicated by a `"P"` pushed onto the `bidActions` array. When the lowest rank (0, representing two) has been bid, a lower bid can be made by increasing the number of points the bid-winning team must collect in order to win--this is represented by a `"Y"`. Each `"Y"` raises the threshold by 2 points above the initial 61 points. The bidding round is complete when the last four items in the `bidActions` array are each `"P"`s, meaning that after the last bid, the next four players passed.

The next phase of the game will consist of "tricks" where each player, in turn, chooses a card from their hand to throw. These are pushed onto the `trickCards` array. When all 5 players have thrown a card into the first trick, it is time for the winner of the bid to call the monkey suit, setting the `monkeySuit` attribute. Now, the winner of the trick can be determined: it is the player who threw the highest card of the suit that was led, unless a monkey suit card was thrown, in which case it's the player who threw the highest monkey suit card. The winner of each trick will be the first throw in the next trick, continuing clockwise. When there are 40 cards in the `trickCards` array, then all cards have been played, scores for the round can be calculated and the next round begins.

### The Game Itself

Briscalone is a five-player trick-taking card game originating from Italy. The novelty of the game is that in each round, it's generally the case that you'll end up with the following 2 vs 3 situation:

- One player has earned the privilege of calling the monkey suit, and in doing so has identified the card that their partner for the round is holding. However, they do not know who among the four other players holds that card.
- One player has that identified card and is on a team with the player who calls the monkey suit. This is the only player with full knowledge of the makeup of the teams.
- The remaining 3 players only know that the player who called the monkey suit is not on their team. They need to try to figure how which one of the other players is the partner.

Hilarity ensues. This app's version is most similar to the game described [here](https://www.pagat.com/aceten/briscola_chiamata.html) with the "Prima Mano al Buio" variant, simplified scoring and with the rank/point values of cards as:

- Ace	11 points
- Ten	10 points
- King	4 points
- Queen 	3 points
- Jack	2 points
- Six	0 points
- Five	0 points
- Four	0 points
- Three 0 points
- Two	0 points
