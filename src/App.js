import React, { Component } from 'react';
import './App.css';
import { Assessment, Home, List, RiskGraph } from "./components/";

import { AppBar, Tab, Tabs, Toolbar, Typography } from "@material-ui/core";
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
  constructor(props){
    super(props);

    this.state = {
      value: 'dashboard'
    };
  }

  handleChange = (event, value) => {
    this.setState({ value });
  };

  render() {
    const { value } = this.state;
    return (
      <MuiThemeProvider theme={theme}>
        <AppBar position="static">
          <Tabs value={value} onChange={this.handleChange}>
            <Tab value="dashboard" label="Dashboard" />
            <Tab value="projects" label="Projects" />
            <Tab value="products" label="Products" />
            <Tab value="suppliers" label="Suppliers" />
            <Tab value="network" label="Supply Network" />
          </Tabs>
        </AppBar>
        {value === 'dashboard' && <Home />}
        {value === 'projects' && <List />}
        {value === 'products' && <List />}
        {value === 'suppliers' && <List />}
        {value === 'network' && <RiskGraph />}
      </MuiThemeProvider>
    )
  }
}

export default App;
