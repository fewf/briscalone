import React, {Component} from 'react';
import {
  MIDDLE_TABLE_PLAYER_COLUMN_WIDTH,
  TOP_TABLE_ROW_HEIGHT,
  MIDDLE_TABLE_TABLE_COLUMN_WIDTH,
  MIDDLE_TABLE_HEIGHT,
  TABLE_TOP_OFFSETS,
  TABLE_BOTTOM_OFFSETS,
  TABLE_LEFT_OFFSETS,
  TABLE_RIGHT_OFFSETS,
  TABLE_ROTATE_OFFSETS
} from '../constants/LAYOUT';
import range from 'lodash/range';

class Table extends Component {
  render() {
    const {round, seatIndex} = this.props;
    return (
      <div style={{position: 'relative', left: `${MIDDLE_TABLE_PLAYER_COLUMN_WIDTH}%`, top: `${TOP_TABLE_ROW_HEIGHT}%`, width:`${MIDDLE_TABLE_TABLE_COLUMN_WIDTH}%`, height: `${MIDDLE_TABLE_HEIGHT}%`}}>
        {
          range(5).map(index => {
              const offset = (index + 5 - seatIndex) % 5;
              return (
                <span
                  key={index}
                  style={{
                    position: 'absolute',
                    top: TABLE_TOP_OFFSETS[offset],
                    bottom: TABLE_BOTTOM_OFFSETS[offset],
                    left: TABLE_LEFT_OFFSETS[offset],
                    right: TABLE_RIGHT_OFFSETS[offset],
                    transform: `rotate(${['0', '-90', '-35', '35', '90'][offset]}deg)`,
                    fontWeight: bidderIndex === index ? 'bold' : null
                  }}
                >
                  {child}
                </span>
              )
          })
        }
      </div>
    );
  }
}

export default Table;
