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
    this.state = {
      game: GameEngine(),
      username: '',
      usernames: [],
      chatMessages: []
    };
  }

  initializeWebSocketClient() {
    const host = location.origin.replace(/^http/, 'ws')
    const ws = new WebSocket(host);
    ws.onmessage = ({data}) => {
      if (!isNaN(data)) return;
      ws.send(JSON.stringify({
        messageType: 'initialize',
        message: this.state.user
      }));
      ws.onmessage = ({data}) => {
        if (!isNaN(data)) return;
        const message = JSON.parse(data);
        this.setState({seatIndex: message.seatIndex, usernames: message.usernames || []});
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
  render() {
    const {chatMessages, game, seatIndex, username, usernames, ws} = this.state;

    const chat = (
      <Chat
        chatMessages={chatMessages}
        sendMessage={this.sendMessage}
        username={username}
        ws={ws}
      />
    )
    if (!username) {
      return (
        <div>
          <h1>Who are you?</h1>
          <form
            onSubmit={
              e => {
                e.preventDefault();
                if (this.username.value) {
                  this.setState(
                    {username: this.username.value},
                    this.initializeWebSocketClient
                  )
                }
              }
            }
          >
            <input
              type='text'
              ref={u => this.username = u}
            />
          </form>
        </div>
      );
    } else if (!game.rounds.length) {
      return (
        <div style={{position: 'relative'}}>
          <h1>Hi {username}, we're waiting for more players</h1>
          {chat}
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
        {chat}
      </div>
    );
  }
}

ReactDOM.render(
  <BriscaloneApp />,
  document.getElementById('root')
);
