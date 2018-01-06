import React from 'react';
import ReactDOM from 'react-dom';
const GameEngine = require('../game/GameEngine');
const cardGlyphs = ['🂢', '🂣', '🂤', '🂥', '🂦', '🂫', '🂭', '🂮', '🂪', '🂡', '🂲', '🂳', '🂴', '🂵', '🂶', '🂻', '🂽', '🂾', '🂺', '🂱', '🃂', '🃃', '🃄', '🃅', '🃆', '🃋', '🃍', '🃎', '🃊', '🃁', '🃒', '🃓', '🃔', '🃕', '🃖', '🃛', '🃝', '🃞', '🃚', '🃑'];
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
  '♠',
  '♥',
  '♦',
  '♣'
]
class BriscaloneApp extends React.Component {
  constructor(props) {
    super(props);
    const stored = window.localStorage.getItem('state');
    if (stored) {
      this.state = JSON.parse(stored);
      this.state.game = GameEngine(this.state.game);
    } else {
      this.state = {
        game: GameEngine()
      };
    }
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
  componentDidUpdate(prevProps, prevState) {
    const {
      rounds,
      players,
      trick,
      lastTrick,
      bid
    } = this.state.game;
    window.localStorage.setItem(
      'state',
      JSON.stringify({
        ...this.state,
        game: {
          rounds,
          players,
          trick,
          lastTrick,
          bid
        }
      })
    );
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
    const isCurrentPlayer = game.playerIndex === index;
    const offset = (index + 5 - game.players.findIndex(p => p.isClient)) % 5;
    const playerLastBid = game.bid.bidActions.slice(Math.floor(game.bid.bidActions.length/5) * 5)[index];
    console.log(game);
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
        <p>Player {index + 1}</p>
        <p>
          {
            player.cards && player.cards.map(
              card => (
                !isNaN(card.cardNum)
                ? <span
                    onClick={() => ws.send(JSON.stringify({messageType: 'throw', message: card.cardNum}))}
                    style={{
                      color: [1, 2].indexOf(card.suit) !== -1 ? 'red' : 'white',
                      fontSize: 45
                    }}
                  >
                    {cardGlyphs[card.cardNum]}
                  </span>
                : '🂠 '
              )
            )
          }
        </p>
        <p>
          {
            game.bid && !game.bid.isFinal
            ? <p>Last bid: {rankOrder[playerLastBid] ? rankOrder[playerLastBid] : playerLastBid}</p>
            : null
          }
          {
            !player.isClient || !isCurrentPlayer || !game.bid
            ? null
            : !game.bid.isFinal
            ? (
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
            : game.trick && game.trick.length === 5 && isNaN(game.bid.suit)
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
  render() {
    const {game} = this.state;
    // if (!game.players) {
    //   return <h1>Waiting for more players</h1>
    // }
    // const clientPlayerFirst = [...game.players];
    // while(!clientPlayerFirst[0].isClient) {
    //   clientPlayerFirst.push(clientPlayerFirst.shift());
    // }
    return (
      <div>
        <h1>BRISCALONE</h1>
        <div style={{position: 'relative', width: '100%', height: '100%'}}>
          {
            game.players && game.players.map(
              this.renderPlayer
            )
          }
          <div style={{position: 'absolute', top: '33%', left: '33%'}}>
            {
              game.trick && game.trick.map(
                card => (
                  <span
                    style={{
                      color: [1, 2].indexOf(card.suit) !== -1 ? 'red' : 'white',
                      fontSize: 35
                    }}
                  >
                    {cardGlyphs[card.cardNum]}
                  </span>
                )
              )
            }
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <BriscaloneApp />,
  document.getElementById('root')
);
