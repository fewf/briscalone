import React from 'react';
import ReactDOM from 'react-dom';
import Card from './components/Card';
import {getRank, getSuit} from '../game/cardUtils';
const sortBy = require('lodash/sortBy');
const GameEngine = require('../game/GameEngine');
const rankOrder = [
  '2',
  '3',
  '4',
  '5',
  '6',
  'J',
  'Q',
  'K',
  '10',
  'A'
]

const suitOrder = [
  '♦',
  '♠',
  '♥',
  '♣'
]
class BriscaloneApp extends React.Component {
  constructor(props) {
    super(props);
    const stored = window.localStorage.getItem('state');
    if (stored) {
      this.state = JSON.parse(stored);
      this.state.game = GameEngine(this.state.game.rounds);
    } else {
      this.state = {
        game: GameEngine()
      };
    }
    this.renderPlayer = this.renderPlayer.bind(this);
    this.renderScore = this.renderScore.bind(this);
    this.renderTrick = this.renderTrick.bind(this);
    this.initializeClient = this.initializeClient.bind(this);
  }
  componentDidMount() {
    const host = location.origin.replace(/^http/, 'ws')
    const ws = new WebSocket(host);
    ws.onmessage = ({data}) => {
      console.log('first message')
      console.log(data)
      ws.send(JSON.stringify({
        messageType: 'initialize',
        message: window.localStorage.getItem('socketKey')
      }));
      ws.onmessage = ({data}) => {
        console.log('second message');
        console.log(data);
        this.initializeClient(JSON.parse(data));
        ws.onmessage = ({data}) => {
          console.log('perpetual message');
          console.log(data);
          const message = JSON.parse(data);
          this.setState({
            game: GameEngine(message.game),
            seatIndex: message.seatIndex
          });
        };
      }
    }
    this.setState({ws});
  }
  renderScore() {
    const {game} = this.state;
    const {gameScore, roundScores} = game;
    console.log(roundScores)
    return <table><tbody>
      <tr>
        <th>1</th>
        <th>2</th>
        <th>3</th>
        <th>4</th>
        <th>5</th>
      </tr>
      {
        roundScores.map(
          (scores, i) => (
            <tr key={i}>
              {
                scores.map((score, j) =>
                  <td key={j}>{score}</td>
                )
              }
            </tr>
          )
        )
      }
      <tr>
        {
          gameScore.map((total, i) => <td>{total}</td>)
        }
      </tr>
    </tbody></table>
  }

  initializeClient(data) {
    const socketKey = window.localStorage.getItem('socketKey');
    if (socketKey !== data.socketKey) {
      window.localStorage.setItem('socketKey', data.socketKey);
      this.setState({playerIndex: data.playerIndex});
    }
  }

  renderPlayer(playerHand, index) {
    const {game, ws, seatIndex} = this.state;
    const round = game.loadRound();
    const isCurrentPlayer = round.playerIndex === index;
    const isSeatedPlayer = seatIndex === index;
    const offset = (index + 5 - seatIndex) % 5;
    const trick = round.trick;
    const playerCard = trick && trick.filter((ba, i) => (i + round.trickFirstPlayerIndex) % 5 === index).pop()
    console.log(round.trickCards.filter((ba, i) => (i + round.roundFirstPlayerIndex) % 5 === index).pop())
    console.log(index)
    const playerLastBid = round.bidActions.filter((ba, i) => (i + round.roundFirstPlayerIndex) % 5 === index).pop()
    const {nextAction} = round;

    return (
      <div
        key={index}
        style={{
          border: `2px solid ${isCurrentPlayer ? 'black' : 'lightgray'}`,
          borderRadius: 5,
          position: 'absolute',
          width: offset === 0 ? '100%' : '50%',
          minHeight: '30%',
          top: [
            '60%',
            '30%',
            '0%',
            '0%',
            '30%'
          ][offset],
          left: [
            '0%',
            '0%',
            '0%',
            '50%',
            '50%'
          ][offset]
        }}>
        {
          !isNaN(playerCard)
          ? <Card card={playerCard} />
          : null
        }
        <p>Player {index + 1}</p>
        {
          index === round.bidderIndex
          ? <p>Player {round.bidIsFinal ? 'won' : 'is winning'} the bid</p>
          : round.partnerIsRevealed && index === round.partnerIndex
          ? <p>Player is bidder's partner</p>
          : null
        }
        <p>Player has taken {round.playerTricks(index).length} tricks worth {round.playerPointsTaken(index)} points</p>
        {
          isSeatedPlayer
          ? (
              <div>
                {sortBy(playerHand, [getSuit, getRank]).map(
                  card => (
                    isSeatedPlayer
                    ? <Card
                        style={{width: '12%'}}
                        card={card}
                        onClick={() => ws.send(JSON.stringify({messageType: 'throw', message: card}))}
                      />
                    : '🂠 '
                  )
                )}
              </div>
            )
          : null
        }
        {
          !round.bidIsFinal
          ? <p>
              Last bid: {
                rankOrder[playerLastBid]
                ? rankOrder[playerLastBid]
                : playerLastBid === 'P' ? 'Passed'
                : playerLastBid === 'Y' ? `2 and ${round.bidPoints} points`
                : null
              }. {
                round.bidderIndex === index ? 'Player is current high bidder' : null
              }
            </p>
          : null
        }
        {
          !isSeatedPlayer || !isCurrentPlayer
          ? null
          : !round.bidIsFinal
          ? (
              <span>
                <button
                  style={{margin: 10, fontSize: 24}}
                  onClick={() => ws.send(JSON.stringify({messageType: 'bid', message: 'P'}))}
                >
                  Pass
                </button>
                {
                  round.bidRank === 0
                  ? <button
                      style={{margin: 10, fontSize: 24}}
                      onClick={() => ws.send(JSON.stringify({messageType: 'bid', message: 'Y'}))}
                    >
                      2 and {round.bidPoints + 2} points
                    </button>
                  : rankOrder.filter((x, i) => i < round.bidRank).map(
                      (rank, i) => (
                        <button
                          style={{margin: 10, fontSize: 24}}
                          key={i}
                          disabled={false}
                          onClick={() => ws.send(JSON.stringify({messageType: 'bid', message: i}))}
                        >
                          {rank}
                        </button>
                      )
                    )
                }
              </span>
            )
          : round.nextAction === 'monkey'
          ? suitOrder.map((suit, i) => (
                <button style={{padding: '5%', color: i % 1 ? 'red' : 'black'}} onClick={() => ws.send(JSON.stringify({messageType: 'monkey', message: i}))}>
                  {suit}
                </button>
              )
            )
          : null
        }
      </div>
    );
  }

  renderTrick() {
    const {game} = this.state;
    const round = game.loadRound();

  }
  render() {
    const {game} = this.state;

    if (!game.rounds.length) {
      console.log(game.rounds)
      return <div><h1>Waiting for more players</h1><button onClick={() => window.localStorage.clear()}>clear ls</button></div>
    }
    const round = game.loadRound();
    console.log('partner card')
    console.log(round.monkeySuit)
    console.log(round.bidRank)
    return (
      <div style={{position: 'relative', width: '100%', height: '100%'}}>
        <div>
          {
            round.playerHands && round.playerHands.map(
              this.renderPlayer
            )
          }
        </div>
        {this.renderTrick()}
        <div style={{position: 'absolute', top: '90%'}}>
          {this.renderScore()}
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <BriscaloneApp />,
  document.getElementById('root')
);
