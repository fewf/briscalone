import React, { Component } from "react";
import Card from "./Card";
import range from "lodash/range";
import {
  TABLE_TOP_OFFSETS,
  TABLE_BOTTOM_OFFSETS,
  TABLE_LEFT_OFFSETS,
  TABLE_RIGHT_OFFSETS,
  TABLE_ROTATE_OFFSETS
} from "../constants/LAYOUT";

class Trick extends Component {
  render() {
    const {
      seatIndex,
      trickFirstPlayerIndex,
      trick,
      bidderIndex,
      bidPoints
    } = this.props;
    return (
      <div>
        {range(5).map(index => {
          const offset = (index + 5 - seatIndex) % 5;
          const playerCard =
            trick &&
            trick
              .filter((ba, i) => (i + trickFirstPlayerIndex) % 5 === index)
              .pop();
          return (
            <Card
              key={index}
              card={playerCard}
              style={{
                position: "absolute",
                top: TABLE_TOP_OFFSETS[offset],
                bottom: TABLE_BOTTOM_OFFSETS[offset],
                left: TABLE_LEFT_OFFSETS[offset],
                right: TABLE_RIGHT_OFFSETS[offset],
                transform: `rotate(${TABLE_ROTATE_OFFSETS[offset]}deg)`,
                height: "40%"
              }}
            />
          );
        })}
      </div>
    );
  }
}

export default Trick;
