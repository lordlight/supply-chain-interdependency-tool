import React, { Component } from "react";
import clsx from "clsx";
import "./App.css";
import {
  /*Breadcrumb,*/ Home,
  ItemOverview,
  /*QuestionList,*/ RiskGraph
} from "./components/";

// Redux
import { connect } from "react-redux";
import store from "./redux/store";
import {
  updateCurrentType,
  updateCurrentItem,
  updateNavState,
  updateTempResponses,
  updateTypeRisk,
  reset
} from "./redux/actions";

// Risk calculation
import { calculateItemRisk } from "./utils/risk-calculations";
// Material UI
import { withStyles } from "@material-ui/core/styles";
import {
  AppBar,
  Drawer,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button
} from "@material-ui/core";

import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import MenuIcon from "@material-ui/icons/Menu";
import CloseIcon from "@material-ui/icons/Close";
import ChevronLeft from "@material-ui/icons/ChevronLeft";
import ChevronRight from "@material-ui/icons/ChevronRight";

import { version, versiondate, fullname } from "../package.json";
import About from "./imgs/about.png";
// import About from "./components/about/About";

// This only works when running electron or as an app (i.e. will not work in browser).
const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

const ABOUT_HEIGHT = 480;
const ABOUT_WIDTH = 960;

const theme = createMuiTheme({
  typography: {
    useNextVariants: true
  },
  palette: {
    primary: {
      main: "#12659c"
    },
    secondary: {
      main: "#257a2d"
    }
  },
  spacing: {
    doubleUnit: 16
  },
  typography: {
    fontFamily: '"Source Sans Pro"'
  }
});

const styles = theme => ({
  appbar: {
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  appbarShift: {
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginLeft: 240
  },
  toolbar: {
    paddingLeft: 0
  },
  questionsToolbar: {
    paddingLeft: "0px",
    backgroundColor: "#257a2d",
    color: "black"
  },
  questionsToolbarText: {
    fontSize: "18px",
    fontWeight: 400,
    paddingLeft: "24px"
  },
  toolbarHeading: {
    paddingLeft: "24px"
  },
  tabsRoot: {
    backgroundColor: "white",
    color: "primary"
  },
  tabsIndicator: {
    backgroundColor: "#12659c",
    color: "#12659c"
  },
  tabRoot: {
    color: "rgba(0,0,0,0.6)",
    textTransform: "uppercase",
    "&:hover": {
      color: "#12659c",
      opacity: 1
    },
    "&$tabSelected": {
      color: "#12659c"
    }
  },
  tabSelected: {},
  drawer: {
    width: 240,
    flexShrink: 0
  },
  drawerPaper: {
    width: 240
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    padding: "0 8px",
    ...theme.mixins.toolbar,
    justifyContent: "flex-end"
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    marginLeft: 0
  },
  contentShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginLeft: 240
  },
  hide: {
    display: "none"
  },
  about: {
    backgroundImage: `url(${About}), none`,
    backgroundSize: "contain",
    height: ABOUT_HEIGHT,
    width: ABOUT_WIDTH,
    maxWidth: ABOUT_WIDTH
  },
  aboutName: {
    fontFamily: "sans-serif",
    fontWeight: "bold",
    color: "white",
    fontSize: "2em",
    position: "absolute",
    left: 40,
    bottom: 103
  },
  aboutVersion: {
    fontFamily: "sans-serif",
    fontWeight: "bold",
    color: "#d8d8d8",
    fontSize: "1.5em",
    position: "absolute",
    left: 40,
    bottom: 72
  }
});

const mapState = state => ({
  navState: state.navState,
  currentType: state.currentType,
  currentItem: state.currentItem,
  suppliers: state.suppliers,
  products: state.products,
  projects: state.projects,
  shadowProjects: state.shadowProjects,
  supplierQuestions: state.supplierQuestions,
  productQuestions: state.productQuestions,
  projectQuestions: state.projectQuestions,
  supplierResponses: state.supplierResponses,
  productResponses: state.productResponses,
  projectResponses: state.projectResponses
});

class App extends Component {
  state = {
    drawerOpen: false,
    clearDialogOpen: false,
    aboutOpen: false
  };

  componentDidMount() {
    // Let the main/server know the app has started.
    ipcRenderer.send("renderer-loaded");
    ipcRenderer.on("clear-all-data-response", (event, arg) => {
      store.dispatch(reset());
      this.handleDrawerClose();
    });
  }

  componentWillReceiveProps(nextProps) {
    let diff = Object.keys(nextProps)
      .filter(key => {
        return nextProps[key] !== this.props[key];
      })
      .map(key => {
        if (key.includes("Responses") && !key.includes("temp")) {
          Object.keys(nextProps[key])
            .filter(qKey => {
              return nextProps[key][qKey] !== this.props[key][qKey];
            })
            .map(qKey => {
              return nextProps[key][qKey];
            });

          return { [key]: nextProps[key] };
        } else {
          // If not a response change, pass along an empty object (so it is ignored).
          return {};
        }
        //console.log('changed property:', key, 'from', this.props[key], 'to, ', nextProps[key]);
      });
    //console.log("diff: ", diff);
    if (diff !== {}) {
      console.log("response update: ", diff);
      ipcRenderer.send("response-update", diff);
    }

    // TEMP - Do risk calculation (just for testing; will figure out most appropriate place later)
    if (nextProps.suppliers.length > 0) {
      store.dispatch(
        updateTypeRisk({
          type: "suppliers",
          itemsRisk: calculateItemRisk(
            "suppliers",
            nextProps.supplierResponses,
            nextProps.supplierQuestions,
            nextProps.suppliers
          )
        })
      );
    }
    if (nextProps.products.length > 0) {
      store.dispatch(
        updateTypeRisk({
          type: "products",
          itemsRisk: calculateItemRisk(
            "products",
            nextProps.productResponses,
            nextProps.productQuestions,
            nextProps.products
          )
        })
      );
    }
    if (nextProps.projects.length > 0) {
      store.dispatch(
        updateTypeRisk({
          type: "projects",
          itemsRisk: calculateItemRisk(
            "projects",
            nextProps.projectResponses,
            nextProps.projectQuestions,
            nextProps.projects
          )
        })
      );
    }
    if (nextProps.shadowProjects.length > 0) {
      const organizations = nextProps.projects.filter(proj => !proj.parent);
      if (organizations.length > 0) {
        const parentId = organizations[0].ID;
        const projectResponses = {};
        nextProps.shadowProjects.forEach(proj => {
          const responses = {};
          Object.entries(proj.default_responses).forEach(entry => {
            responses[`${entry[0]}|${parentId}`] = entry[1];
          });
          projectResponses[proj.ID] = responses;
        });
        const projects = nextProps.shadowProjects.map(pr => {
          return {
            ...pr,
            parent: organizations[0],
            "Parent ID": organizations[0].ID
          };
        });
        store.dispatch(
          updateTypeRisk({
            type: "projects",
            itemsRisk: calculateItemRisk(
              "projects",
              projectResponses,
              nextProps.projectQuestions,
              projects
            )
          })
        );
      }
    }
  }

  handleChange = (event, value) => {
    store.dispatch(updateNavState({ navState: value }));
  };

  handleTabChange = (event, props) => {
    store.dispatch(updateCurrentType({ currentType: props.currentType }));
  };

  handleQuestionPageBack = event => {
    store.dispatch(updateCurrentItem({ currentItem: null }));
    store.dispatch(updateTempResponses({ tempResponses: {} }));
  };

  handleDrawerOpen = event => this.setState({ drawerOpen: true });
  handleDrawerClose = event => this.setState({ drawerOpen: false });
  handleQuit = event => window.close();
  handleAboutOpen = event =>
    this.setState({ aboutOpen: true, drawerOpen: false });
  handleAboutClose = event => this.setState({ aboutOpen: false });
  handleClearAllData = event => ipcRenderer.send("clear-all-data");

  handleClearDialogClose = () => {
    this.setState({ clearDialogOpen: false });
  };

  render() {
    const { classes } = this.props;
    const value = this.props.navState;
    const mainProps = { currentType: null };
    const suppProps = { currentType: "suppliers" };
    const prodProps = { currentType: "products" };
    const projProps = { currentType: "projects" };
    return (
      <MuiThemeProvider theme={theme}>
        <AppBar
          position="static"
          className={clsx(classes.appbar, {
            [classes.appbarShift]: this.state.drawerOpen
          })}
        >
          <Toolbar className={classes.toolbar}>
            <IconButton
              className={clsx(
                this.props.menuButton,
                this.state.drawerOpen && classes.hide
              )}
              color="inherit"
              aria-label="Open drawer"
              onClick={this.handleDrawerOpen}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              className={classes.toolbarHeading}
              variant="h6"
              color="inherit"
              style={{ fontWeight: "regular" }}
            >
              {fullname}
            </Typography>
          </Toolbar>
          {this.props.currentItem == null ? (
            <Tabs
              classes={{
                root: classes.tabsRoot,
                indicator: classes.tabsIndicator
              }}
              value={value}
              onChange={this.handleChange}
            >
              <Tab
                classes={{
                  root: classes.tabRoot,
                  selected: classes.tabSelected
                }}
                value="home"
                label="Dashboard"
                onClick={e => this.handleTabChange(e, mainProps)}
              />
              <Tab
                classes={{
                  root: classes.tabRoot,
                  selected: classes.tabSelected
                }}
                value="suppliers"
                label="Suppliers"
                onClick={e => this.handleTabChange(e, suppProps)}
              />
              <Tab
                classes={{
                  root: classes.tabRoot,
                  selected: classes.tabSelected
                }}
                value="products"
                label="Products"
                onClick={e => this.handleTabChange(e, prodProps)}
              />
              <Tab
                classes={{
                  root: classes.tabRoot,
                  selected: classes.tabSelected
                }}
                value="projects"
                label="Projects"
                onClick={e => this.handleTabChange(e, projProps)}
              />
              <Tab
                classes={{
                  root: classes.tabRoot,
                  selected: classes.tabSelected
                }}
                value="network"
                label="Supply Chain"
              />
            </Tabs>
          ) : (
            <Toolbar className={classes.questionsToolbar}>
              <IconButton
                color="inherit"
                onClick={e => this.handleQuestionPageBack(e)}
              >
                <ChevronLeft />
              </IconButton>
              <Typography className={classes.questionsToolbarText}>
                {(() => {
                  if (this.props.currentType === "suppliers")
                    return "Supplier ";
                  else if (this.props.currentType === "products")
                    return "Product ";
                  else if (this.props.currentType === "projects")
                    return "Project ";
                })()}
                Questions: {this.props.currentItem.Name}
              </Typography>
            </Toolbar>
          )}
        </AppBar>
        <Drawer
          className={classes.drawer}
          variant="persistent"
          anchor="left"
          open={this.state.drawerOpen}
          classes={{
            paper: classes.drawerPaper
          }}
        >
          <div className={classes.drawerHeader}>
            <IconButton onClick={this.handleDrawerClose}>
              {theme.direction === "ltr" ? <ChevronLeft /> : <ChevronRight />}
            </IconButton>
          </div>
          <Divider />
          <List>
            <ListItem button onClick={this.handleAboutOpen}>
              <ListItemText primary="About..." />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Edit Question Weightings..." />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Preferences..." />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem
              button
              onClick={() => this.setState({ clearDialogOpen: true })}
            >
              <ListItemText primary="Clear All Data..." />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button onClick={this.handleQuit}>
              <ListItemText primary="Close" />
            </ListItem>
          </List>
        </Drawer>
        <div
          className={clsx(classes.content, {
            [classes.contentShift]: this.state.drawerOpen
          })}
        >
          {value === "home" && <Home />}
          {value === "projects" && <ItemOverview />}
          {value === "products" && <ItemOverview />}
          {value === "suppliers" && <ItemOverview />}
          {value === "network" && <RiskGraph />}
        </div>
        <Dialog
          onClose={() => this.setState({ clearDialogOpen: false })}
          aria-labelledby="clear-dialog-title"
          open={this.state.clearDialogOpen}
        >
          <DialogTitle id="clear-dialog-title">Clear All Data</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Warning: this will permanently remove all supplier, product and
              project data, as well as any question responses. Continue?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClearDialogClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                this.handleClearAllData();
                this.handleClearDialogClose();
              }}
              color="primary"
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          classes={{ paper: classes.about }}
          open={this.state.aboutOpen}
          onClose={this.handleAboutClose}
        >
          <div style={{ color: "white" }}>
            <IconButton
              onClick={this.handleAboutClose}
              color="inherit"
              style={{ float: "right" }}
            >
              <CloseIcon />
            </IconButton>
          </div>
          <Typography className={classes.aboutName}>{fullname}</Typography>
          <Typography className={classes.aboutVersion}>
            {`Version ${version} - ${versiondate}`}
          </Typography>
        </Dialog>
      </MuiThemeProvider>
    );
  }
}

export default withStyles(styles)(connect(mapState)(App));
