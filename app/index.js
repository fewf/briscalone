import React from 'react';
import ReactDOM from 'react-dom';
const GameEngine = require('../game/GameEngine')
const cardGlyphs = ['🂢', '🂲', '🃂', '🃒', '🂣', '🂳', '🃃', '🃓', '🂤', '🂴', '🃄', '🃔', '🂥', '🂵', '🃅', '🃕', '🂦', '🂶', '🃆', '🃖', '🂫', '🂻', '🃋', '🃛', '🂭', '🂽', '🃍', '🃝', '🂮', '🂾', '🃎', '🃞', '🂪', '🂺', '🃊', '🃚', '🂡', '🂱', '🃁', '🃑'];

class BriscaloneApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      game: GameEngine()
    };
    this.renderPlayer = this.renderPlayer.bind(this);
    this.initializeClient = this.initializeClient.bind(this);
  }
  componentDidMount() {
    const host = location.origin.replace(/^http/, 'ws')
    const ws = new WebSocket(host);
    ws.onmessage = ({data}) => {
      ws.send(JSON.stringify({
        messageType: 'initialize',
        message: window.localStorage.getItem('socketKey')
      }));
      ws.onmessage = ({data}) => {
        this.initializeClient(JSON.parse(data));
        ws.onmessage = ({data}) => {
          console.log(JSON.parse(data).game)
          this.setState({game: GameEngine(JSON.parse(data).game)});
        };
      }
    }
    this.setState({ws});
  }
  initializeClient(data) {
    const socketKey = window.localStorage.getItem('socketKey');
    if (socketKey !== data.socketKey) {
      window.localStorage.setItem('socketKey', data.socketKey);
      this.setState({playerIndex: data.playerIndex});
    }
  }
  renderPlayer(player, index) {
    const {game, ws} = this.state;
    console.log(game);
    return (
      <div key={index}>
        <p>Player {index + 1}</p>
        <p>
          {
            player.cards && player.cards.map(
              card => (
                !isNaN(card.cardNum)
                ? cardGlyphs[card.cardNum]
                : '🂠'
              )
            ).join(' ')
          }
        </p>
        <p>
          {
            !player.isClient || game.playerIndex !== index
            ? null
            : !game.bid || game.bid.isFinal
            ? null
            : (
                <span>
                  <button
                    onClick={() => ws.send(JSON.stringify({messageType: 'bid', message: 'P'}))}
                  >
                    Pass
                  </button>
                  {
                    game.bid.rank === 0
                    ? <button
                        onClick={() => ws.send(JSON.stringify({messageType: 'bid', message: 'Y'}))}
                      >
                        2 and {game.bid.points + 2} points
                      </button>
                    : [
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
                      ].map(
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
          }
        </p>
      </div>
    );
  }
  render() {
    const {game} = this.state;
    return (
      <div>
        <h1>BRISCALONE</h1>
        <div>
          {
            game.players && game.players.map(
              this.renderPlayer
            )
          }
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <BriscaloneApp />,
  document.getElementById('root')
);
