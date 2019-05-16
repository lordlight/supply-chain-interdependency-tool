import React, { Component } from 'react';
import './App.css';
import { /*Breadcrumb,*/ Home, ItemOverview, /*QuestionList,*/ RiskGraph } from "./components/";

// Redux
import { connect } from "react-redux";
import store from './redux/store';
import { updateCurrentType, updateCurrentItem, updateNavState, updateTempResponses, updateTypeRisk } from "./redux/actions";

// Risk calculation
import { calculateItemRisk } from './utils/risk-calculations';
// Material UI
import { withStyles } from '@material-ui/core/styles';
import { AppBar, IconButton, Tab, Tabs, Toolbar, Typography } from "@material-ui/core";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeft from '@material-ui/icons/ChevronLeft';

// This only works when running electron or as an app (i.e. will not work in browser).
const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#12659c',
    },
    secondary: {
      main: '#257a2d',
    },
  },
  spacing: {
    doubleUnit: 16,
  },
  typography: {
    fontFamily: '"Source Sans Pro"',
  },
});

const styles = theme => ({
  toolbar: {
    paddingLeft: '0px',
  },
  questionsToolbar: {
    paddingLeft: '0px',
    backgroundColor: '#257a2d',
    color: 'black',
  },
  questionsToolbarText: {
    fontSize: '18px',
    fontWeight: 400,
    paddingLeft: '24px',
  },
  toolbarHeading: {
    paddingLeft: '24px',
  },
  tabsRoot: {
    backgroundColor: 'white',
    color: 'primary',
  },
  tabsIndicator: {
    backgroundColor: '#12659c',
    color: '#12659c',
  },
  tabRoot: {
    color: 'rgba(0,0,0,0.6)',
    textTransform: 'uppercase',
    '&:hover': {
      color: '#12659c',
      opacity: 1,
    },
    '&$tabSelected': {
      color: '#12659c',
    },
  },
  tabSelected: {},
});

const mapState = state => ({
  navState: state.navState,
  currentType: state.currentType,
  currentItem: state.currentItem,
  suppliers: state.suppliers,
  products: state.products,
  projects: state.projects,
  supplierQuestions: state.supplierQuestions,
  productQuestions: state.productQuestions,
  projectQuestions: state.projectQuestions,
  supplierResponses: state.supplierResponses,
  productResponses: state.productResponses,
  projectResponses: state.projectResponses
});

class App extends Component {
  componentDidMount(){
    // Let the main/server know the app has started.
    ipcRenderer.send('renderer-loaded');
  }

  componentWillReceiveProps(nextProps){
    
    let diff = Object.keys(nextProps)
        .filter(key => {
          return nextProps[key] !== this.props[key];
        })
        .map(key => {
          if (key.includes("Responses") && !key.includes("temp")){
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
    //console.log("diff: ", diff);
    if (diff !== {}) {
      console.log("response update: ", diff);
      ipcRenderer.send('response-update', diff);
    }

    // TEMP - Do risk calculation (just for testing; will figure out most appropriate place later)
    if (nextProps.suppliers.length > 0){
      store.dispatch(updateTypeRisk({"type":"suppliers", "itemsRisk":calculateItemRisk(nextProps.supplierResponses, nextProps.supplierQuestions)}));
    }
    if (nextProps.products.length > 0){
      store.dispatch(updateTypeRisk({"type":"products", "itemsRisk":calculateItemRisk(nextProps.productResponses, nextProps.productQuestions)}));
    }
    if (nextProps.projects.length > 0){
      store.dispatch(updateTypeRisk({"type":"projects", "itemsRisk":calculateItemRisk(nextProps.projectResponses, nextProps.projectQuestions)}));
    }
  }

  handleChange = (event, value) => {
    store.dispatch(updateNavState({navState: value}));
  };

  handleTabChange = (event, props) => {
    store.dispatch(updateCurrentType({currentType: props.currentType}));
  }

  handleQuestionPageBack = (event) => {
      store.dispatch(updateCurrentItem({currentItem: null}));
      store.dispatch(updateTempResponses({tempResponses: {}}));
  }

  render() {
    const { classes } = this.props;
    const value = this.props.navState;
    const mainProps = {currentType: null};
    const suppProps = {currentType: "suppliers"};
    const prodProps = {currentType: "products"};
    const projProps = {currentType: "projects"};
    return (
      <MuiThemeProvider theme={theme}>
        <AppBar position="static">
          <Toolbar className={classes.toolbar}>
            <IconButton className={this.props.menuButton} color="inherit" aria-label="Open drawer">
              <MenuIcon />
            </IconButton>
            <Typography className={classes.toolbarHeading} variant="h6" color="inherit" style={{fontWeight: "regular"}}>
              NIST Cyber Supply Chain Management
            </Typography>
          </Toolbar>
          {this.props.currentItem == null
            ? <Tabs
               classes={{root: classes.tabsRoot, indicator: classes.tabsIndicator}}
               value={value}
               onChange={this.handleChange}>
                <Tab
                  classes={{root: classes.tabRoot, selected: classes.tabSelected}}
                  value="home"
                  label="Dashboard"
                  onClick={(e) => this.handleTabChange(e, mainProps)}/>
                <Tab
                  classes={{root: classes.tabRoot, selected: classes.tabSelected}}
                  value="suppliers"
                  label="Suppliers"
                  onClick={(e) => this.handleTabChange(e, suppProps)} />
                <Tab
                  classes={{root: classes.tabRoot, selected: classes.tabSelected}}
                  value="products"
                  label="Products"
                  onClick={(e) => this.handleTabChange(e, prodProps)}/>
                <Tab
                  classes={{root: classes.tabRoot, selected: classes.tabSelected}}
                  value="projects"
                  label="Projects"
                  onClick={(e) => this.handleTabChange(e, projProps)}/>
                <Tab
                  classes={{root: classes.tabRoot, selected: classes.tabSelected}}
                  value="network"
                  label="Supply Chain" />
              </Tabs>
            : <Toolbar className={classes.questionsToolbar}>
                <IconButton color="inherit" onClick={(e) => this.handleQuestionPageBack(e)}>
                  <ChevronLeft />
                </IconButton>
                <Typography className={classes.questionsToolbarText}>
                  {(() => {
                    if (this.props.currentType === "suppliers") return "Supplier ";
                    else if (this.props.currentType === "products") return "Product ";
                    else if (this.props.currentType === "projects") return "Project ";
                  })()}
                  Questions: {this.props.currentItem.Name}
                </Typography>
              </Toolbar>
          }
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

export default withStyles(styles)(connect(mapState)(App));
