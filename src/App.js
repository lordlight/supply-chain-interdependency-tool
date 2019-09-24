import React, { Component } from "react";
import clsx from "clsx";
import "./App.css";
import { Home, ItemOverview, Visualizations } from "./components/";

// Redux
import { connect } from "react-redux";
import store from "./redux/store";
import {
  updateCurrentType,
  updateCurrentItem,
  updateNavState,
  updateTempResponses,
  updateTypeRisk,
  updateScores,
  updatePreferences,
  reset
} from "./redux/actions";

// Risk calculation
import { calculateItemRisk, computeImpacts } from "./utils/risk-calculations";
import {
  ResourcesDesignators,
  AVAILABLE_COLORSCHEMES,
  DEFAULT_COLORSCHEME
} from "./utils/general-utils";

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
  Button,
  Grid,
  TextField,
  FormControl,
  Select,
  MenuItem
} from "@material-ui/core";

import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import MenuIcon from "@material-ui/icons/Menu";
import CloseIcon from "@material-ui/icons/Close";
import ChevronLeft from "@material-ui/icons/ChevronLeft";
import ChevronRight from "@material-ui/icons/ChevronRight";

import { version, versiondate, fullname } from "../package.json";
import About from "./imgs/about.png";

// This only works when running electron or as an app (i.e. will not work in browser).
const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

const ABOUT_HEIGHT = 480;
const ABOUT_WIDTH = 960;

const theme = createMuiTheme({
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
    useNextVariants: true,
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
  },
  preferences: {
    width: "100%"
  }
});

const mapState = state => ({
  navState: state.navState,
  currentType: state.currentType,
  currentItem: state.currentItem,
  suppliers: state.suppliers,
  products: state.products,
  projects: state.projects,
  assets: state.assets,
  supplierQuestions: state.supplierQuestions,
  productQuestions: state.productQuestions,
  projectQuestions: state.projectQuestions,
  supplierResponses: state.supplierResponses,
  productResponses: state.productResponses,
  projectResponses: state.projectResponses,
  preferences: state.preferences
});

class App extends Component {
  state = {
    drawerOpen: false,
    clearDialogOpen: false,
    aboutOpen: false,
    preferencesDialogOpen: false,
    designators: {
      project: "",
      Project: "",
      projects: "",
      Projects: "",
      product: "",
      Product: "",
      products: "",
      Products: "",
      supplier: "",
      suppliers: "",
      Supplier: "",
      Suppliers: ""
    },
    colorscheme: DEFAULT_COLORSCHEME
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
          // If not a response change, pass along null (so it is ignored).
          return null;
        }
      })
      .filter(Boolean);
    if (diff.length > 0) {
      ipcRenderer.send("response-update", diff);
    }

    // could be other conditions that cause recalculate as well later...
    const recalculateScores = diff.length > 0;
    if (recalculateScores) {
      const suppliersRisk =
        nextProps.suppliers.length > 0
          ? calculateItemRisk(
              "suppliers",
              nextProps.supplierResponses,
              nextProps.supplierQuestions,
              nextProps.suppliers
            )
          : null;
      const productsRisk =
        nextProps.products.length > 0
          ? calculateItemRisk(
              "products",
              nextProps.productResponses,
              nextProps.productQuestions,
              nextProps.products
            )
          : null;
      const projectsRisk =
        nextProps.projects.length > 0
          ? calculateItemRisk(
              "projects",
              nextProps.projectResponses,
              nextProps.projectQuestions,
              nextProps.projects
            )
          : null;

      if (nextProps.suppliers.length > 0) {
        store.dispatch(
          updateTypeRisk({
            type: "suppliers",
            itemsRisk: suppliersRisk
          })
        );
      }
      if (nextProps.products.length > 0) {
        store.dispatch(
          updateTypeRisk({
            type: "products",
            itemsRisk: productsRisk
          })
        );
      }
      if (nextProps.projects.length > 0) {
        store.dispatch(
          updateTypeRisk({
            type: "projects",
            itemsRisk: projectsRisk
          })
        );
      }

      let assetsRisk = null;
      if (nextProps.assets.length > 0) {
        const organizations = nextProps.projects.filter(proj => !proj.parent);
        if (organizations.length > 0) {
          const parentId = organizations[0].ID;
          const projectResponses = {};
          nextProps.assets.forEach(proj => {
            const responses = {};
            Object.entries(proj.default_responses).forEach(entry => {
              responses[`${entry[0]}|${parentId}`] = entry[1];
            });
            projectResponses[proj.ID] = responses;
          });
          const assets = nextProps.assets.map(pr => {
            return {
              ...pr,
              parent: organizations[0],
              "Parent ID": organizations[0].ID
            };
          });
          assetsRisk = calculateItemRisk(
            "assets",
            projectResponses,
            nextProps.projectQuestions,
            assets
          );
          store.dispatch(
            updateTypeRisk({
              type: "assets",
              itemsRisk: assetsRisk
            })
          );
        }
      }

      if (suppliersRisk && productsRisk && projectsRisk && assetsRisk) {
        const scores = computeImpacts(
          projectsRisk,
          productsRisk,
          suppliersRisk,
          assetsRisk,
          nextProps.projects,
          nextProps.products,
          nextProps.suppliers,
          nextProps.assets
        );
        store.dispatch(updateScores(scores));
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
  handleClearAllData = event => {
    ipcRenderer.send("clear-all-data");
  };

  handleClearDialogClose = () => {
    this.setState({ clearDialogOpen: false });
  };

  handlePreferencesDialogOpen = () => {
    const preferences = this.props.preferences;
    this.setState({
      preferencesDialogOpen: true,
      designators: {
        project: "",
        Project: "",
        projects: "",
        Projects: "",
        product: "",
        Product: "",
        products: "",
        Products: "",
        supplier: "",
        suppliers: "",
        Supplier: "",
        Suppliers: "",
        ...(preferences["resources.designators"] || {})
      },
      colorscheme: preferences["viz.colorscheme"] || DEFAULT_COLORSCHEME
    });
  };

  handlePreferencesDialogClose = () => {
    this.setState({ preferencesDialogOpen: false });
  };

  updateResourceDesignators = () => {
    const { designators } = this.state;
    const preferences = {
      "resources.designators": {
        ...designators
      }
    };
    store.dispatch(updatePreferences(preferences));
    ipcRenderer.send("update-preferences", preferences);
  };

  updateColorScheme = () => {
    const { colorscheme } = this.state;
    const preferences = {
      "viz.colorscheme": colorscheme
    };
    store.dispatch(updatePreferences(preferences));
    ipcRenderer.send("update-preferences", preferences);
  };

  render() {
    const { classes, preferences = {} } = this.props;

    const value = this.props.navState;
    const mainProps = { currentType: null };
    const suppProps = { currentType: "suppliers" };
    const prodProps = { currentType: "products" };
    const projProps = { currentType: "projects" };

    const resourceDesignators = new ResourcesDesignators(preferences);

    let colorSchemes = { ...AVAILABLE_COLORSCHEMES };
    delete colorSchemes[DEFAULT_COLORSCHEME];
    colorSchemes = [DEFAULT_COLORSCHEME, ...Object.keys(colorSchemes)];

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
                label={resourceDesignators.getPlural("Supplier")}
                onClick={e => this.handleTabChange(e, suppProps)}
              />
              <Tab
                classes={{
                  root: classes.tabRoot,
                  selected: classes.tabSelected
                }}
                value="products"
                label={resourceDesignators.getPlural("Product")}
                onClick={e => this.handleTabChange(e, prodProps)}
              />
              <Tab
                classes={{
                  root: classes.tabRoot,
                  selected: classes.tabSelected
                }}
                value="projects"
                label={resourceDesignators.getPlural("Project")}
                onClick={e => this.handleTabChange(e, projProps)}
              />
              <Tab
                classes={{
                  root: classes.tabRoot,
                  selected: classes.tabSelected
                }}
                value="visualizations"
                label="Visualizations"
              />
            </Tabs>
          ) : (
            <Toolbar className={classes.questionsToolbar}>
              <IconButton
                color="inherit"
                onClick={e => this.handleQuestionPageBack(e)}
                style={{ visibility: "hidden" }}
              >
                <ChevronLeft />
              </IconButton>
              <Typography className={classes.questionsToolbarText}>
                {(() => {
                  if (this.props.currentType === "suppliers")
                    return `${resourceDesignators.get("Supplier")} `;
                  else if (this.props.currentType === "products")
                    return `${resourceDesignators.get("Product")} `;
                  else if (this.props.currentType === "projects")
                    return `${resourceDesignators.get("Project")} `;
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
            <ListItem button onClick={this.handlePreferencesDialogOpen}>
              <ListItemText primary="Preferences..." />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem
              button
              onClick={() => this.setState({ clearDialogOpen: true })}
              disabled={value === "visualizations"}
            >
              <ListItemText primary="Clear All Data..." />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button onClick={this.handleQuit}>
              <ListItemText primary="Close Application" />
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
          {value === "visualizations" && <Visualizations />}
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
        <Dialog
          onClose={() => this.setState({ preferencesDialogOpen: false })}
          aria-labelledby="preferences-dialog-title"
          open={this.state.preferencesDialogOpen}
          classes={{ paper: classes.preferences }}
        >
          <DialogTitle id="preferences-dialog-title">
            Set User Preferences
          </DialogTitle>
          <DialogContent>
            <Typography variant="subtitle1" style={{ marginBottom: 12 }}>
              Resource Nomenclature
            </Typography>
            <DialogContentText style={{ marginBottom: 12 }}>
              Modify how resources are labeled in in the application. If no
              plural form is provided, plural is presumed to be the resource
              designation with an &quot;s&quot; appended.
            </DialogContentText>
            <Grid container direction="column" style={{ marginBottom: 12 }}>
              {[
                ["Project", "project", "Projects", "projects"],
                ["Product", "product", "Products", "products"],
                ["Supplier", "supplier", "Suppliers", "suppliers"]
              ].map(entry => {
                const [resource, lresource, resources, lresources] = entry;
                return (
                  <Grid
                    key={resource}
                    container
                    direction="row"
                    style={{ alignItems: "center" }}
                    spacing={8}
                  >
                    <Grid item xs={2}>
                      <Typography>{resource}</Typography>
                    </Grid>
                    <Grid item xs={5}>
                      <TextField
                        label="User Designation"
                        value={this.state.designators[resource]}
                        onChange={event =>
                          this.setState({
                            designators: {
                              ...this.state.designators,
                              [resource]: event.target.value,
                              [lresource]: event.target.value.toLowerCase()
                            }
                          })
                        }
                        margin="dense"
                      />
                    </Grid>
                    <Grid item xs={5}>
                      <TextField
                        label="Plural (optional)"
                        value={this.state.designators[resources]}
                        onChange={event =>
                          this.setState({
                            designators: {
                              ...this.state.designators,
                              [resources]: event.target.value,
                              [lresources]: event.target.value.toLowerCase()
                            }
                          })
                        }
                        margin="dense"
                      />
                    </Grid>
                  </Grid>
                );
              })}
            </Grid>
            <Divider />
            <Typography
              variant="subtitle1"
              style={{ marginTop: 12, marginBottom: 12 }}
            >
              Visualization Color Schemes
            </Typography>
            <DialogContentText style={{ marginBottom: 12 }}>
              Choose the color scheme to be used for visualizations.
            </DialogContentText>
            <Grid container direction="column">
              <FormControl className={classes.formControl}>
                <Select
                  value={this.state.colorscheme}
                  onChange={event =>
                    this.setState({ colorscheme: event.target.value })
                  }
                  inputProps={{
                    name: "colorscheme",
                    id: "colorscheme"
                  }}
                >
                  {colorSchemes.map(scheme => (
                    <MenuItem key={scheme} value={scheme}>
                      {scheme}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handlePreferencesDialogClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                this.updateResourceDesignators();
                this.updateColorScheme();
                this.handlePreferencesDialogClose();
              }}
              color="primary"
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </MuiThemeProvider>
    );
  }
}

export default withStyles(styles)(connect(mapState)(App));
