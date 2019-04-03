import React from 'react';
import ReactDOM from 'react-dom';
import { ChatFeed, Message } from 'react-chat-ui';
import Table from './components/Table';
import Bids from './components/Bids';
import Trick from './components/Trick';
import Player from './components/Player';
import Score from './components/Score';
import {rankOrder, suitOrder} from './constants/CARDS';
import {
  TOP_TABLE_ROW_HEIGHT,
  MIDDLE_TABLE_HEIGHT,
  BOTTOM_TABLE_HEIGHT,
  ROUND_INFO_HEIGHT,
  GAME_SCORES_HEIGHT,
  CHAT_HEIGHT
} from './constants/LAYOUT';
const GameEngine = require('../game/GameEngine');


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
    this.initializeClient = this.initializeClient.bind(this);
  }
  componentDidMount() {
    const host = location.origin.replace(/^http/, 'ws')
    const ws = new WebSocket(host);
    ws.onmessage = ({data}) => {
      if (!isNaN(data)) return;
      ws.send(JSON.stringify({
        messageType: 'initialize',
        message: window.localStorage.getItem('socketKey')
      }));
      ws.onmessage = ({data}) => {
        if (!isNaN(data)) return;
        this.initializeClient(JSON.parse(data));
        ws.onmessage = ({data}) => {
          if (!isNaN(data)) return;
          const message = JSON.parse(data);
          if (message.game) message.game = GameEngine(message.game);
          if (message.chatMessages) message.chatMessages = message.chatMessages.map(cm => new Message(cm));
          this.setState(message);
        };
      }
    }
    this.setState({ws});
  }


  initializeClient(data) {
    window.localStorage.setItem('socketKey', data.socketKey);
    this.setState({seatIndex: data.seatIndex, usernames: data.usernames || []});
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
    const {game, seatIndex, usernames, ws} = this.state;

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
              (playerHand, handIndex) => (
                <Player
                  bidderIndex={round.bidderIndex}
                  bidIsFinal={round.bidIsFinal}
                  bidPoints={round.bidPoints}
                  bidRank={round.bidRank}
                  handIndex={handIndex}
                  nextAction={round.nextAction}
                  playerHand={playerHand}
                  playerIndex={round.playerIndex}
                  playerTricks={round.playerTricks(handIndex)}
                  playerPointsTaken={round.playerPointsTaken(handIndex)}
                  seatIndex={seatIndex}
                  usernames={usernames}
                  ws={ws}
                />
              )
            )
          }
        </div>
        <Table
          seatIndex={seatIndex}
          bidderIndex={round.bidderIndex}
        >

          {
            round.bidIsFinal
            ? <Trick
                bidderIndex={round.bidderIndex}
                bidPoints={round.bidPoints}
                trick={round.trick}
                trickFirstPlayerIndex={round.trickFirstPlayerIndex}
                seatIndex={seatIndex}
              />
            : <Bids
                bidActions={round.bidActions}
                bidderIndex={round.bidderIndex}
                bidPoints={round.bidPoints}
                roundFirstPlayerIndex={round.roundFirstPlayerIndex}
                seatIndex={seatIndex}
              />
          }
        </Table>
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
        <Score
          gameScore={game.gameScore}
          roundScores={game.roundScores}
          usernames={usernames}
        />
        {this.renderChat()}
      </div>
    );
  }
}

ReactDOM.render(
  <BriscaloneApp />,
  document.getElementById('root')
);
