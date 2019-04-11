import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import { Typography, Button } from "@material-ui/core";

// This only works when running electron or as an app (i.e. will not work in browser).
const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

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

    render() {
        const { classes } = this.props;
        const bull = <span className="bullet">•</span>;

        return (
            <div className={classes.root}>
                <Grid container justify="center" spacing={24}>
                    <Grid item xs={5}>
                        <Paper className={classes.paper}>Overview</Paper>
                    </Grid>
                    <Grid item xs={3} onDragEnter={this.dragEnterHandler} onDragOver={this.dragOverHandler} onDrop={(e) => this.dropHandler(e, "projects")}>
                        {/*<Card className="card">
                            <CardContent>
                                <Typography className="title" color="textSecondary" gutterBottom>
                                    Word of the Day
                                </Typography>
                                <Typography variant="h5" component="h2">
                                    be
                                    {bull}
                                    nev
                                    {bull}o{bull}
                                    lent
                                </Typography>
                                <Typography className="blarg" color="textSecondary">
                                    adjective
                                    </Typography>
                                    <Typography component="p">
                                    well meaning and kindly.
                                    <br />
                                    {'"a benevolent smile"'}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small">Learn More</Button>
                            </CardActions>
                        </Card>*/}
                        <Paper className={classes.paper}>Projects</Paper>
                    </Grid>
                    <Grid item xs={3}>
                        <Paper className={classes.paper}>Products</Paper>
                    </Grid>
                    <Grid item xs={3}>
                        <Paper className={classes.paper}>Suppliers</Paper>
                    </Grid>
                </Grid>
            </div>
        );
  }
}

export default withStyles(styles)(Home);