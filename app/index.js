import React from 'react';
import ReactDOM from 'react-dom';
import { ChatFeed, Message } from 'react-chat-ui';
import Card from './components/Card';
import {getRank, getSuit} from '../game/cardUtils';
const sortBy = require('lodash/sortBy');
const range = require('lodash/range');
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
const TOP_TABLE_ROW_HEIGHT = 10;
const MIDDLE_TABLE_HEIGHT = 35;
const BOTTOM_TABLE_HEIGHT = 25;
const ROUND_INFO_HEIGHT = 5;
const GAME_SCORES_HEIGHT = 10;
const CHAT_HEIGHT = 15;

const TOP_TABLE_PLAYER_COLUMN_WIDTH = 50;

const MIDDLE_TABLE_PLAYER_COLUMN_WIDTH = 15;
const MIDDLE_TABLE_TABLE_COLUMN_WIDTH = 70;

const suitOrder = [
  '♦',
  '♠',
  '♥',
  '♣'
];

const customBubble = props => (
  <p style={{lineHeight: 0}}>{`${props.message.senderName}: ${
    props.message.message
  }`}</p>
);

class BriscaloneApp extends React.Component {
  constructor(props) {
    super(props);
    const stored = window.localStorage.getItem('state');
    if (stored) {
      this.state = JSON.parse(stored);
      this.state.game = GameEngine(this.state.game.rounds);
    } else {
      this.state = {
        game: GameEngine(),
        usernames: [],
        chatMessages: []
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
      if (!isNaN(data)) return;
      console.log('first message')
      console.log(data)
      ws.send(JSON.stringify({
        messageType: 'initialize',
        message: window.localStorage.getItem('socketKey')
      }));
      ws.onmessage = ({data}) => {
        if (!isNaN(data)) return;
        console.log('second message');
        console.log(data);
        this.initializeClient(JSON.parse(data));
        ws.onmessage = ({data}) => {
          if (!isNaN(data)) return;
          console.log('perpetual message');
          console.log(data);
          const message = JSON.parse(data);
          if (message.game) message.game = GameEngine(message.game);
          if (message.chatMessages) message.chatMessages = message.chatMessages.map(cm => new Message(cm));
          console.log(message);
          this.setState(message);
        };
      }
    }
    this.setState({ws});
  }
  renderScore() {
    const {game, usernames} = this.state;
    const {gameScore, roundScores} = game;
    console.log(roundScores)
    const divStyle = {display: 'inline-block', minWidth: '20%'};
    return <div style={{
      height: `${GAME_SCORES_HEIGHT}%`,
      top: `${TOP_TABLE_ROW_HEIGHT + MIDDLE_TABLE_HEIGHT + BOTTOM_TABLE_HEIGHT + ROUND_INFO_HEIGHT}%`,
      position: 'absolute',
      width: '100%',
      overflow: 'scroll'
    }}>
      {
        range(5).map(
          index => <div style={divStyle}>{usernames[index] || `Player ${index + 1}`}</div>
        )
      }
      <div>
        {
          gameScore.map((total, i) => <div style={{fontWeight: 'bold', ...divStyle}}>{total}</div>)
        }
      </div>
      {
        roundScores.map(
          (scores, i) => (
            <div key={i}>
              {
                scores.map(
                  (score, j) => <div key={j} style={divStyle}>{score}</div>
                )
              }
            </div>
          )
        )
      }
    </div>
  }

  initializeClient(data) {
    window.localStorage.setItem('socketKey', data.socketKey);
    this.setState({seatIndex: data.seatIndex, usernames: data.usernames || []});
  }

  renderPlayer(playerHand, index) {
    const {game, ws, seatIndex, usernames} = this.state;
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
    const isTopPlayer = offset === 2 || offset === 3;
    const isMiddlePlayer = !isTopPlayer && !isSeatedPlayer;
    const playerName = usernames[index] || `Player ${index + 1}`
    return (
      <div
        key={index}
        style={{
          border: `2px solid ${isCurrentPlayer ? 'black' : 'lightgray'}`,
          borderRadius: 5,
          position: 'absolute',
          width: isSeatedPlayer ? '100%' : isTopPlayer ?  `${TOP_TABLE_PLAYER_COLUMN_WIDTH}%` : `${MIDDLE_TABLE_PLAYER_COLUMN_WIDTH}%`,
          height: isTopPlayer ? `${TOP_TABLE_ROW_HEIGHT}%` : isMiddlePlayer ? `${MIDDLE_TABLE_HEIGHT}%` : `${BOTTOM_TABLE_HEIGHT}%`,
          top: [
            `${TOP_TABLE_ROW_HEIGHT + MIDDLE_TABLE_HEIGHT}%`,
            `${TOP_TABLE_ROW_HEIGHT}%`,
            '0%',
            '0%',
            `${TOP_TABLE_ROW_HEIGHT}%`
          ][offset],
          left: [
            '0%',
            '0%',
            '0%',
            `${TOP_TABLE_PLAYER_COLUMN_WIDTH}%`,
            `${MIDDLE_TABLE_PLAYER_COLUMN_WIDTH + MIDDLE_TABLE_TABLE_COLUMN_WIDTH}%`
          ][offset]
        }}>
        <div style={offset === 1 || offset === 4 ? {writingMode: 'vertical-lr', float: offset === 4 ? 'right' : null} : null}>
          <p>{playerName}{index === round.bidderIndex ? <span style={{fontWeight: 'bold'}}> • bid winner</span> : null}</p>
          <p>
            TRICKS: {round.playerTricks(index).length} •
            POINTS: {round.playerPointsTaken(index)}
          </p>
        </div>
        {
          isSeatedPlayer
          ? (
              <div>
                {sortBy(playerHand, [getSuit, getRank]).map(
                  card => (
                    <Card
                      style={{width: '12%'}}
                      card={card}
                      onClick={() => ws.send(JSON.stringify({messageType: 'throw', message: card}))}
                    />
                  )
                )}
              </div>
            )
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
                <button style={{padding: '5%', color: i % 1 ? 'red' : 'black', fontSize: 30}} onClick={() => ws.send(JSON.stringify({messageType: 'monkey', message: i}))}>
                  {suit}
                </button>
              )
            )
          : null
        }
      </div>
    );
  }
  renderBid() {
    const {game, seatIndex} = this.state;
    const round = game.loadRound();
    return (
      <div style={{position: 'relative', left: `${MIDDLE_TABLE_PLAYER_COLUMN_WIDTH}%`, top: `${TOP_TABLE_ROW_HEIGHT}%`, width:`${MIDDLE_TABLE_TABLE_COLUMN_WIDTH}%`, height: `${MIDDLE_TABLE_HEIGHT}%`}}>
        {
          range(5).map(
            index => {
              const offset = (index + 5 - seatIndex) % 5;
              const playerLastBid = round.bidActions.filter((ba, i) => (i + round.roundFirstPlayerIndex) % 5 === index).pop()
              console.log(playerLastBid)
              return (

                <span
                  style={{
                    position: 'absolute',
                    top: [null, '40%', '5%', '5%', '40%'][offset],
                    bottom: offset === 0 ? '0%' : null,
                    left: ['35%', '8%', '15%', null, null][offset],
                    right: [null, null, null, '15%', '8%'][offset],
                    fontWeight: round.bidderIndex === index ? 'bold' : null
                  }}
                >
                  {
                    playerLastBid === undefined
                    ? null
                    : playerLastBid === 'P'
                    ? 'I pass'
                    : playerLastBid === 'Y'
                    ? `I bid 2 and ${round.bidPoints} points.`
                    : `I bid ${rankOrder[playerLastBid]}`
                  }
                </span>
              )
            }
          )
        }
      </div>
    )
  }

  renderTrick() {
    const {game, seatIndex} = this.state;
    const round = game.loadRound();
    const trick = round.trick;
    return (
      <div style={{position: 'relative', left: `${MIDDLE_TABLE_PLAYER_COLUMN_WIDTH}%`, top: `${TOP_TABLE_ROW_HEIGHT}%`, width:`${MIDDLE_TABLE_TABLE_COLUMN_WIDTH}%`, height: `${MIDDLE_TABLE_HEIGHT}%`}}>
        {
          range(5).map(
            index => {
              const offset = (index + 5 - seatIndex) % 5;
              const playerCard = trick && trick.filter((ba, i) => (i + round.trickFirstPlayerIndex) % 5 === index).pop()
              return isNaN(playerCard) ? null : (
                <Card
                  card={playerCard}
                  style={{
                    position: 'absolute',
                    top: [null, '40%', '5%', '5%', '40%'][offset],
                    bottom: offset === 0 ? '0%' : null,
                    left: ['35%', '8%', '15%', null, null][offset],
                    right: [null, null, null, '15%', '8%'][offset],
                    height: '40%',
                    transform: `rotate(${['0', '-90', '-35', '35', '90'][offset]}deg)`
                  }}
                />
              )
            }
          )
        }
      </div>
    )



  }
  onMessageSubmit(e) {
    const input = this.message;
    e.preventDefault();
    const {seatIndex, usernames} = this.state;
    if (!input.value) {
      return false;
    }
    if (!usernames[seatIndex]) {
      usernames[seatIndex] = input.value;
      this.setState({usernames});
      this.state.ws.send(JSON.stringify({messageType: 'username', message: input.value}));
    } else {
      this.pushMessage(usernames[seatIndex], seatIndex, input.value);
    }
    input.value = '';
    return true;
  }
  pushMessage(recipient, id, message) {
    const prevState = this.state;
    const messageData = {
      id,
      message,
      senderName: recipient,
    };
    this.state.ws.send(JSON.stringify({messageType: 'chat', message: messageData}));
  }

  renderChat = () => {
    const {game, seatIndex, usernames} = this.state;
    console.log(usernames);
    console.log(usernames[seatIndex]);
    return (
      <div className="chatfeed-wrapper" style={{height: `${CHAT_HEIGHT}%`, top: `${TOP_TABLE_ROW_HEIGHT + MIDDLE_TABLE_HEIGHT + BOTTOM_TABLE_HEIGHT + ROUND_INFO_HEIGHT + GAME_SCORES_HEIGHT}%`, position: 'absolute', width: '100%'}}>
        <ChatFeed
          maxHeight={250}
          messages={this.state.chatMessages} // Boolean: list of message objects
          chatBubble={customBubble}
          showSenderName
        />
        <form onSubmit={e => this.onMessageSubmit(e)}>
          <input
            ref={m => {
              this.message = m;
            }}
            placeholder={!usernames[seatIndex] ? "What's your name?" : "Type a message..."}
            className="message-input"
          />
        </form>
      </div>
    )
  }

  render() {
    const {game, seatIndex, usernames} = this.state;

    if (!game.rounds.length) {
      return (
        <div style={{position: 'relative'}}>
          <h1>Waiting for more players</h1>
          {this.renderChat()}
        </div>
      );
    }
    const round = game.loadRound();
    return (
      <div style={{width: '100%', height: '100%', position: 'relative'}}>
        <div>
          {
            round.playerHands && round.playerHands.map(
              this.renderPlayer
            )
          }
        </div>
        {round.bidIsFinal ? this.renderTrick() : this.renderBid()}
        <div style={{
          height: `${ROUND_INFO_HEIGHT}%`,
          top: `${TOP_TABLE_ROW_HEIGHT + MIDDLE_TABLE_HEIGHT + BOTTOM_TABLE_HEIGHT}%`,
          position: 'absolute',
          width: '100%',
          overflow: 'scroll'
        }}>
          <p>
            ROUND: {game.rounds.length}
            {
              round.bidIsFinal
              ? ` • WINNING BID: ${rankOrder[round.bidRank]}`
              : null
            }
            {
              round.monkeySuit
              ? ` • MONKEY SUIT: ${suitOrder[round.monkeySuit]}`
              : null
            }
          </p>
        </div>
        {this.renderScore()}
        {this.renderChat()}
      </div>
    );
  }
}

ReactDOM.render(
  <BriscaloneApp />,
  document.getElementById('root')
);
