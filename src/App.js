import React, { Component } from 'react';
import './App.css';
import { Assessment, Home, RiskGraph } from "./components/";
import { Link, Route, Switch } from "react-router-dom";

import { AppBar, Toolbar, Typography } from "@material-ui/core";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import { blue, blueGrey } from "@material-ui/core/colors";

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: blueGrey
  },
  spacing: {
    doubleUnit: 16
  }
});

class App extends Component {
  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <nav>
          <AppBar position="static">
            <Toolbar>
              <Typography
                variant="title"
                color="inherit"
                style={{ flexGrow: 1, textDecoration: "none" }}
                component={Link}
                to="/"
              >
                Cyber Risk Analysis Tool
              </Typography>
            </Toolbar>
          </AppBar>
        </nav>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/assessment" component={Assessment} />
          <Route exact path="/risk-visual" component={RiskGraph} />
        </Switch>
      </MuiThemeProvider>
    )
  }
}

export default App;
