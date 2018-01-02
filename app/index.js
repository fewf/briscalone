import React from 'react';
import ReactDOM from 'react-dom';

class BriscaloneApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    const host = location.origin.replace(/^http/, 'ws')
    const ws = new WebSocket(host);
    ws.onmessage = ({data}) => {
      this.setState(JSON.parse(data));
    };
  }
  render() {
    return (
      <div>
        {JSON.stringify(this.state)}
      </div>
    );
  }
}

ReactDOM.render(
  <BriscaloneApp />,
  document.getElementById('root')
);
