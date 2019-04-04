import React, { Component } from "react";
import range from "lodash/range";
import {
  TOP_TABLE_ROW_HEIGHT,
  MIDDLE_TABLE_HEIGHT,
  BOTTOM_TABLE_HEIGHT,
  ROUND_INFO_HEIGHT,
  GAME_SCORES_HEIGHT
} from "../constants/LAYOUT";

class Score extends Component {
  render() {
    const { gameScore, roundScores, usernames } = this.props;
    const divStyle = { display: "inline-block", minWidth: "20%" };
    return (
      <div
        style={{
          height: `${GAME_SCORES_HEIGHT}%`,
          top: `${TOP_TABLE_ROW_HEIGHT +
            MIDDLE_TABLE_HEIGHT +
            BOTTOM_TABLE_HEIGHT +
            ROUND_INFO_HEIGHT}%`,
          position: "absolute",
          width: "100%",
          overflow: "scroll"
        }}
      >
        {range(5).map(index => (
          <div key={index} style={divStyle}>
            {usernames[index] || `Player ${index + 1}`}
          </div>
        ))}
        <div>
          {gameScore.map((total, i) => (
            <div key={i} style={{ fontWeight: "bold", ...divStyle }}>
              {total}
            </div>
          ))}
        </div>
        {roundScores.map((scores, i) => (
          <div key={i}>
            {scores.map((score, j) => (
              <div key={j} style={divStyle}>
                {score}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
}

export default Score;
