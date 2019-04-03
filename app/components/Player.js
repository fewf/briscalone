import React, {Component} from 'react';
import sortBy from 'lodash/sortBy';
import Card from './Card';
import {
  TOP_TABLE_ROW_HEIGHT,
  MIDDLE_TABLE_HEIGHT,
  BOTTOM_TABLE_HEIGHT,
  TOP_TABLE_PLAYER_COLUMN_WIDTH,
  MIDDLE_TABLE_PLAYER_COLUMN_WIDTH,
  MIDDLE_TABLE_TABLE_COLUMN_WIDTH,
} from '../constants/LAYOUT';
import {rankOrder, suitOrder} from '../constants/CARDS';
import {getRank, getSuit} from '../../game/cardUtils';



class Player extends Component {
  render() {
    const {
      bidderIndex,
      bidIsFinal,
      bidPoints,
      bidRank,
      handIndex,
      nextAction,
      playerHand,
      playerIndex,
      playerTricks,
      playerPointsTaken,
      ws,
      seatIndex,
      usernames
    } = this.props;
    const isCurrentPlayer = playerIndex === handIndex;
    const isSeatedPlayer = seatIndex === handIndex;
    const offset = (handIndex + 5 - seatIndex) % 5;
    const isTopPlayer = offset === 2 || offset === 3;
    const isMiddlePlayer = !isTopPlayer && !isSeatedPlayer;
    const playerName = usernames[handIndex] || `Player ${handIndex + 1}`
    return (
      <div
        key={handIndex}
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
          <p>{playerName}{handIndex === bidderIndex ? <span style={{fontWeight: 'bold'}}> • bid winner</span> : null}</p>
          <p>
            TRICKS: {playerTricks.length} •
            POINTS: {playerPointsTaken}
          </p>
        </div>
        {
          isSeatedPlayer
          ? (
              <div>
                {sortBy(playerHand, [getSuit, getRank]).map(
                  card => (
                    <Card
                      key={card}
                      style={{width: '12%'}}
                      card={card}
                      className='handCard'
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
          : !bidIsFinal
          ? (
              <span>
                <button
                  style={{margin: 10, fontSize: 24}}
                  onClick={() => ws.send(JSON.stringify({messageType: 'bid', message: 'P'}))}
                >
                  Pass
                </button>
                {
                  bidRank === 0
                  ? <button
                      style={{margin: 10, fontSize: 24}}
                      onClick={() => ws.send(JSON.stringify({messageType: 'bid', message: 'Y'}))}
                    >
                      2 and {bidPoints + 2} points
                    </button>
                  : rankOrder.filter((x, i) => i < bidRank).map(
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
          : nextAction === 'monkey'
          ? suitOrder.map((suit, i) => (
                <button className='suitButton' key={i} style={{padding: '5%', color: i % 1 ? 'red' : 'black', fontSize: 30}} onClick={() => ws.send(JSON.stringify({messageType: 'monkey', message: i}))}>
                  {suit}
                </button>
              )
            )
          : null
        }
      </div>
    );
  }
}

export default Player;
