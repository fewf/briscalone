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
    const playerCard = round.trick && round.trick[
      (index + 5 - game.loadRound(
        {
          ...game.roundData,
          trickCards: round.trickCards.slice(
            0, Math.floor(round.trickCards.length/5) * 5
          )
        }
      ).playerIndex) % 5
    ]

    const playerLastBid = round.bidActions.filter((ba, i) => (i + round.roundFirstPlayerIndex) % 5 === index).pop()
    const {nextAction} = round;

    return (
      <div
        key={index}
        style={{
          border: `2px solid ${isCurrentPlayer ? 'white' : 'black'}`,
          borderRadius: 5,
          position: 'absolute',
          top: [
            '56%',
            '28%',
            '0%',
            '0%',
            '28%'
          ][offset],
          left: [
            '28%',
            '0%',
            '15%',
            '65%',
            '80%'
          ][offset]
        }}>
        {
          !isNaN(playerCard)
          ? <Card card={playerCard} />
          : null
        }
        <p>Player {index + 1}</p>
        <p>
          {
            sortBy(playerHand, [getSuit, getRank]).map(
              card => (
                isSeatedPlayer
                ? <Card
                    card={card}
                    onClick={() => ws.send(JSON.stringify({messageType: 'throw', message: card}))}
                  />
                : '🂠 '
              )
            )
          }
        </p>
        <p>
          {
            !round.bidIsFinal
            ? <p>Last bid: {rankOrder[playerLastBid] ? rankOrder[playerLastBid] : playerLastBid}</p>
            : null
          }
          {
            !isSeatedPlayer || !isCurrentPlayer
            ? null
            : !round.bidIsFinal
            ? (
                <span>
                  <button
                    onClick={() => ws.send(JSON.stringify({messageType: 'bid', message: 'P'}))}
                  >
                    Pass
                  </button>
                  {
                    round.bidRank === 0
                    ? <button
                        onClick={() => ws.send(JSON.stringify({messageType: 'bid', message: 'Y'}))}
                      >
                        2 and {round.bidPoints + 2} points
                      </button>
                    : rankOrder.map(
                        (rank, i) => (
                          <button
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
                  <span onClick={() => ws.send(JSON.stringify({messageType: 'monkey', message: i}))}>
                    {suit}
                  </span>
                )
              )
            : null
          }
        </p>
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
    return (
      <div>
        <div style={{position: 'relative', width: '100%', height: '100%'}}>
          {
            round.playerHands && round.playerHands.map(
              this.renderPlayer
            )
          }
        </div>
        {this.renderTrick()}
        {this.renderScore()}
        <p>bid rank is {rankOrder[round.bidRank]}</p>
      </div>
    );
  }
}

ReactDOM.render(
  <BriscaloneApp />,
  document.getElementById('root')
);
