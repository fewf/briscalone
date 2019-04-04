import React, { Component } from "react";
import {
  MIDDLE_TABLE_PLAYER_COLUMN_WIDTH,
  TOP_TABLE_ROW_HEIGHT,
  MIDDLE_TABLE_TABLE_COLUMN_WIDTH,
  MIDDLE_TABLE_HEIGHT
} from "../constants/LAYOUT";

class Table extends Component {
  render() {
    const { bidderIndex, children, round, seatIndex } = this.props;
    return (
      <div
        style={{
          position: "relative",
          left: `${MIDDLE_TABLE_PLAYER_COLUMN_WIDTH}%`,
          top: `${TOP_TABLE_ROW_HEIGHT}%`,
          width: `${MIDDLE_TABLE_TABLE_COLUMN_WIDTH}%`,
          height: `${MIDDLE_TABLE_HEIGHT}%`
        }}
      >
        {children}
      </div>
    );
  }
}

export default Table;
