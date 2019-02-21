import React, {Component} from 'react';
import {rankOrder} from '../constants/CARDS';

class Bids extends Component {
  render() {
    const {
      bidActions,
      seatIndex,
      roundFirstPlayerIndex,
      bidderIndex,
      bidPoints
    } = this.props;
    return (
      <div>
        {
          range(5).map(
            index => {
              const offset = (index + 5 - seatIndex) % 5;
              const playerLastBid = bidActions.filter((ba, i) => (i + roundFirstPlayerIndex) % 5 === index).pop()
              return (
                <span
                  key={index}
                  style={{
                    position: 'absolute',
                    top: [null, '40%', '5%', '5%', '40%'][offset],
                    bottom: offset === 0 ? '0%' : null,
                    left: ['35%', '8%', '15%', null, null][offset],
                    right: [null, null, null, '15%', '8%'][offset],
                    fontWeight: bidderIndex === index ? 'bold' : null
                  }}
                >
                  {
                    playerLastBid === undefined
                    ? null
                    : playerLastBid === 'P'
                    ? 'I pass'
                    : playerLastBid === 'Y'
                    ? `I bid 2 and ${bidPoints} points.`
                    : `I bid ${rankOrder[playerLastBid]}`
                  }
                </span>
              )
            }
          )
        }
      </div>
    );
  }
}

export default Bids;
