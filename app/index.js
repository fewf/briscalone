import React from 'react';
import ReactDOM from 'react-dom';
import { Message } from 'react-chat-ui';
import Table from './components/Table';
import Bids from './components/Bids';
import Trick from './components/Trick';
import Player from './components/Player';
import Score from './components/Score';
import GameInfo from './components/GameInfo';
import Chat from './components/Chat';
const GameEngine = require('../game/GameEngine');

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
  render() {
    const {chatMessages, game, seatIndex, usernames, ws} = this.state;

    if (!game.rounds.length) {
      return (
        <div style={{position: 'relative'}}>
          <h1>Waiting for more players</h1>
          <Chat
            chatMessages={chatMessages}
            onMessageSubmit={this.onMessageSubmit}
            seatIndex={seatIndex}
            usernames={usernames}
          />
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
        <GameInfo
          bidIsFinal={round.bidIsFinal}
          bidRank={round.bidRank}
          monkeySuit={round.monkeySuit}
          roundNumber={game.rounds.length}
        />
        <Score
          gameScore={game.gameScore}
          roundScores={game.roundScores}
          usernames={usernames}
        />
        <Chat
          chatMessages={chatMessages}
          onMessageSubmit={this.onMessageSubmit}
          seatIndex={seatIndex}
          usernames={usernames}
        />
      </div>
    );
  }
}

ReactDOM.render(
  <BriscaloneApp />,
  document.getElementById('root')
);
