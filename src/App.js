import React, { Component } from 'react';
import './App.css';
import { Home, ItemOverview, QuestionList, RiskGraph } from "./components/";

// Router
import { Route, Switch} from "react-router-dom";

//import { AppBar, Tab, Tabs, Toolbar, Typography } from "@material-ui/core";
import { /*MuiThemeProvider,*/ createMuiTheme } from "@material-ui/core/styles";
import { blue, blueGrey } from "@material-ui/core/colors";

// This only works when running electron or as an app (i.e. will not work in browser).
const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

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

  componentDidMount(){
    // Let the main/server know the app has started.
    ipcRenderer.send('renderer-loaded');
  }

  handleChange = (event, value) => {
    this.setState({ value });
  };

  render() {
    const { value } = this.state;
    return (
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/item-overview" component={ItemOverview} />
        <Route exact path="/question-list" component={QuestionList} />
        <Route exact path="/risk-visual" component={RiskGraph} />
      </Switch>
      /*<MuiThemeProvider theme={theme}>
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
        {value === 'projects' && <ItemOverview type="projects"/>}
        {value === 'products' && <ItemOverview type="products"/>}
        {value === 'suppliers' && <ItemOverview type="suppliers"/>}
        {value === 'network' && <RiskGraph />}
     </MuiThemeProvider>*/
    )
  }
}

export default App;
