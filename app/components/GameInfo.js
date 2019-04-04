import React, { Component } from "react";
import {
  TOP_TABLE_ROW_HEIGHT,
  MIDDLE_TABLE_HEIGHT,
  BOTTOM_TABLE_HEIGHT,
  ROUND_INFO_HEIGHT
} from "../constants/LAYOUT";
import { rankOrder, suitOrder } from "../constants/CARDS";

class GameInfo extends Component {
  render() {
    const { bidIsFinal, bidRank, monkeySuit, roundNumber } = this.props;
    return (
      <div
        style={{
          height: `${ROUND_INFO_HEIGHT}%`,
          top: `${TOP_TABLE_ROW_HEIGHT +
            MIDDLE_TABLE_HEIGHT +
            BOTTOM_TABLE_HEIGHT}%`,
          position: "absolute",
          width: "100%",
          overflow: "scroll"
        }}
      >
        <p>
          ROUND: {roundNumber}
          {bidIsFinal ? ` • WINNING BID: ${rankOrder[bidRank]}` : null}
          {monkeySuit ? ` • MONKEY SUIT: ${suitOrder[monkeySuit]}` : null}
        </p>
      </div>
    );
  }
}

export default GameInfo;
