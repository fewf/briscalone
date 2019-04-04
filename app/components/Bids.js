import React, { Component } from "react";
import { rankOrder } from "../constants/CARDS";
import range from "lodash/range";
import {
  TABLE_TOP_OFFSETS,
  TABLE_BOTTOM_OFFSETS,
  TABLE_LEFT_OFFSETS,
  TABLE_RIGHT_OFFSETS,
  TABLE_ROTATE_OFFSETS
} from "../constants/LAYOUT";

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
        {range(5).map(index => {
          const offset = (index + 5 - seatIndex) % 5;
          const playerLastBid = bidActions
            .filter((ba, i) => (i + roundFirstPlayerIndex) % 5 === index)
            .pop();
          return (
            <span
              key={index}
              style={{
                position: "absolute",
                top: TABLE_TOP_OFFSETS[offset],
                bottom: TABLE_BOTTOM_OFFSETS[offset],
                left: TABLE_LEFT_OFFSETS[offset],
                right: TABLE_RIGHT_OFFSETS[offset],
                transform: `rotate(${TABLE_ROTATE_OFFSETS[offset]}deg)`,
                fontWeight: bidderIndex === index ? "bold" : null
              }}
            >
              {playerLastBid === undefined
                ? null
                : playerLastBid === "P"
                ? "I pass"
                : playerLastBid === "Y"
                ? `I bid 2 and ${bidPoints} points.`
                : `I bid ${rankOrder[playerLastBid]}`}
            </span>
          );
        })}
      </div>
    );
  }
}

export default Bids;
