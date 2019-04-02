import React, { Component } from 'react';
import './App.css';
import { Assessment, Home, RiskGraph } from "./components/";
import { Route, Switch } from "react-router-dom";

class App extends Component {
  render() {
    return (
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/assessment" component={Assessment} />
        <Route exact path="/risk-visual" component={RiskGraph} />
      </Switch>
    )
  }
}

export default App;
