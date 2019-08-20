import React, { Component } from "react";
import candlestick from "../../imgs/candlestick.png";

class CandlestickVisualization extends Component {
  render() {
    return (
      <div style={{ marginTop: 24, marginLeft: 24 }}>
        <img src={candlestick} />
      </div>
    );
  }
}

export default CandlestickVisualization;
