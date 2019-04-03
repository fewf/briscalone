import React, {Component} from 'react';
import { ChatFeed } from 'react-chat-ui';
import {
  TOP_TABLE_ROW_HEIGHT,
  MIDDLE_TABLE_HEIGHT,
  BOTTOM_TABLE_HEIGHT,
  ROUND_INFO_HEIGHT,
  GAME_SCORES_HEIGHT,
  CHAT_HEIGHT
} from '../constants/LAYOUT';

const customBubble = props => (
  <p style={{lineHeight: 0}}>{`${props.message.senderName}: ${
    props.message.message
  }`}</p>
);

class Chat extends Component {
  render() {
    const {chatMessages, seatIndex, usernames} = this.props;
    return (
      <div className="chatfeed-wrapper" style={{height: `${CHAT_HEIGHT}%`, top: `${TOP_TABLE_ROW_HEIGHT + MIDDLE_TABLE_HEIGHT + BOTTOM_TABLE_HEIGHT + ROUND_INFO_HEIGHT + GAME_SCORES_HEIGHT}%`, position: 'absolute', width: '100%'}}>
        <ChatFeed
          maxHeight={250}
          messages={chatMessages} // Boolean: list of message objects
          chatBubble={customBubble}
          showSenderName
        />
        <form onSubmit={e => this.onMessageSubmit(e)}>
          <input
            ref={m => {
              this.message = m;
            }}
            placeholder={!usernames[seatIndex] ? "What's your name?" : "Type a message..."}
            className="message-input"
          />
        </form>
      </div>
    );
  }
}

export default Chat;
