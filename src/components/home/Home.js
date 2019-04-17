import React, { Component } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import store from '../../redux/store';
import { updateCurrentType } from "../../redux/actions";
import { connect } from "react-redux";

// This only works when running electron or as an app (i.e. will not work in browser).
const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

const mapState = state => ({
    suppliers: state.suppliers,
    products: state.products,
    projects: state.projects
});

const styles = theme => ({
    root: {
      flexGrow: 1,
      marginTop: 12
    },
    paper: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center',
      color: theme.palette.text.secondary,
      height: 200,
      minWidth: 200
    },
  });

class Home extends Component {
    constructor(props){
        super(props);
        // Clear current type on home
        store.dispatch(updateCurrentType({currentType: null}));
    }

    dragEnterHandler = (event) => {
        event.stopPropagation();
        event.preventDefault();
    }

    dragOverHandler = (event) => {
        event.stopPropagation();
        event.preventDefault();
    }

    dropHandler = (event, type) => {
        // Stop default behaviors and propagation.
        event.stopPropagation();
        event.preventDefault();
        
        // Get the items.
        const dt = event.dataTransfer;
        const files = dt.files;

        //const count = files.length;

        //console.log("num files: ", count);

        let req = {type: type, filesToLoad: []};

        for (let i = 0; i < files.length; i++){
            //console.log("File: " + i + ", type: " + typeof(files[i]) + ", name: " + files[i].name);
            //console.log("file: ", files[i]);
            req.filesToLoad.push({name: files[i].name, path:files[i].path});
        }

        console.log("files to load: ", req.filesToLoad);

        // Send the file to the electron main thread.
        ipcRenderer.send('asynchronous-file-load', req);
    }

    handleTypeSelection = (event, type) => {
        store.dispatch(updateCurrentType({currentType: type}));
    }

    render() {
        const { classes } = this.props;

        const url = '/item-overview';

        return (
            <div className={classes.root}>
                <Grid container justify="center" spacing={24}>
                    <Grid item xs={5}>
                        <Paper className={classes.paper}>Overview</Paper>
                    </Grid>
                    <Grid item xs={3}
                          onDragEnter={this.dragEnterHandler}
                          onDragOver={this.dragOverHandler}
                          onDrop={(e) => this.dropHandler(e, "projects")}
                    >
                        { this.props.projects.length < 1
                          ? <Paper className={classes.paper}>Add Projects</Paper>
                          : <Paper className={classes.paper}>
                                <Typography>
                                    <RouterLink 
                                            to={{pathname: url}}
                                            onClick={(e) => this.handleTypeSelection(e, "projects")}
                                        >
                                        {this.props.projects.length} Projects
                                    </RouterLink>
                                </Typography>
                            </Paper>
                        }
                    </Grid>
                    <Grid item xs={3}
                          onDragEnter={this.dragEnterHandler}
                          onDragOver={this.dragOverHandler}
                          onDrop={(e) => this.dropHandler(e, "products")}
                    >
                        { this.props.products.length < 1
                          ? <Paper className={classes.paper}>Add Products</Paper>
                          : <Paper className={classes.paper}>
                                <Typography>
                                    <RouterLink 
                                            to={{pathname: url}}
                                            onClick={(e) => this.handleTypeSelection(e, "Products")}
                                        >
                                        {this.props.products.length} Products
                                    </RouterLink>
                                </Typography>
                            </Paper>
                        }
                    </Grid>
                    <Grid item xs={3}
                          onDragEnter={this.dragEnterHandler}
                          onDragOver={this.dragOverHandler}
                          onDrop={(e) => this.dropHandler(e, "suppliers")}
                    >
                        { this.props.suppliers.length < 1
                          ? <Paper className={classes.paper}>Add Suppliers</Paper>
                          : <Paper className={classes.paper}>
                                <Typography>
                                    <RouterLink 
                                        to={{pathname: url}}
                                        onClick={(e) => this.handleTypeSelection(e, "suppliers")}
                                    >
                                        {this.props.suppliers.length} Suppliers
                                    </RouterLink>
                                </Typography>
                            </Paper>
                        }
                    </Grid>
                </Grid>
            </div>
        );
  }
}

export default withStyles(styles)(connect(mapState)(Home));