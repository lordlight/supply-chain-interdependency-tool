import React, { Component } from 'react';
import './App.css';
import { /*Breadcrumb,*/ Home, ItemOverview, /*QuestionList,*/ RiskGraph } from "./components/";

import { connect } from "react-redux";
import store from './redux/store';
import { updateCurrentType, updateNavState } from "./redux/actions";

// Router
//import { Route, Switch} from "react-router-dom";

import { AppBar, IconButton, Tab, Tabs, Toolbar, Typography } from "@material-ui/core";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import MenuIcon from '@material-ui/icons/Menu';

// This only works when running electron or as an app (i.e. will not work in browser).
const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

const theme = createMuiTheme({
  root: {
    flexGrow: 1,
  },
  palette: {
    primary: {
      main: '#12659c',
    },
    secondary: {
      main: '#257a2d',
    },
  },
  spacing: {
    doubleUnit: 16
  },
  typography: {
    fontFamily: '"Source Sans Pro"',
  },
  tabRoot: {
    background: 'secondary',
  }
});

const mapState = state => ({
  navState: state.navState,
  supplierResponses: state.supplierResponses,
  productResponses: state.productResponses,
  projectResponses: state.projectResponses,
});

class App extends Component {
  componentDidMount(){
    // Let the main/server know the app has started.
    ipcRenderer.send('renderer-loaded');
  }

  componentWillReceiveProps(nextProps){
    //console.log("will receive props");
    let diff = Object.keys(nextProps)
        .filter(key => {
          return nextProps[key] !== this.props[key];
        })
        .map(key => {
          if (key.includes("Responses")){
            Object.keys(nextProps[key])
              .filter(qKey => {
                //console.log("&&&&&&&: ", nextProps[key][qKey], ", ####: ", this.props[key][qKey]);
                return nextProps[key][qKey] !== this.props[key][qKey];
              })
              .map(qKey => {
                return nextProps[key][qKey];
              });

              return {[key]: nextProps[key]};
          } else {
            // If not a response change, pass along an empty object (so it is ignored).
            return {};
          }
          //console.log('changed property:', key, 'from', this.props[key], 'to, ', nextProps[key]);
        });
        ipcRenderer.send('response-update', diff);
  }

  handleChange = (event, value) => {
    store.dispatch(updateNavState({navState: value}));
  };

  handleTabChange = (event, props) => {
    store.dispatch(updateCurrentType({currentType: props.currentType}));
  }

  render() {
    const value = this.props.navState;
    const mainProps = {currentType: null};
    const suppProps = {currentType: "suppliers"};
    const prodProps = {currentType: "products"};
    const projProps = {currentType: "projects"};
    return (
      <MuiThemeProvider theme={theme}>
        <AppBar position="static">
          <Toolbar>
            <IconButton className={this.props.menuButton} color="inherit" aria-label="Open drawer">
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" style={{fontWeight: "lighter"}}>
              NIST Cyber Supply Chain Management
            </Typography>
          </Toolbar>
          <Tabs value={value} onChange={this.handleChange} style={{color: "secondary"}}>
            <Tab value="home" label="Dashboard" onClick={(e) => this.handleTabChange(e, mainProps)}/>
            <Tab value="projects" label="Projects" onClick={(e) => this.handleTabChange(e, projProps)}/>
            <Tab value="products" label="Products" onClick={(e) => this.handleTabChange(e, prodProps)}/>
            <Tab value="suppliers" label="Suppliers"onClick={(e) => this.handleTabChange(e, suppProps)} />
            <Tab value="network" label="Supply Network" />
          </Tabs>
        </AppBar>
        {value === 'home' && <Home/>}
        {value === 'projects' && <ItemOverview/>}
        {value === 'products' && <ItemOverview/>}
        {value === 'suppliers' && <ItemOverview/>}
        {value === 'network' && <RiskGraph/>}
     </MuiThemeProvider>
    )
  }
}

export default connect(mapState)(App);
