import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import store from '../../redux/store';
import { updateCurrentItemId, updateCurrentType, updateNavState } from "../../redux/actions";
import { connect } from "react-redux";

// Images
import placeholder from "../../imgs/placeholder.png";

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
      display: "flex",
      flexWrap: "wrap",
      flexGrow: 1,
      width: "100%",
      justifyContent: "center",
      alignItems: "flex-start"
    },
    card: {
        display:"inline-flex",
        flexShrink: 0,
        width: 344,
        margin: 12,
    },
    desc: {
        fontSize: "15px",
        height: "48px",
        overflow: "hidden",
        lineHeight: "1",
        textOverflow: "ellipsis",
    },
    media: {
        height: 194,
        width: 344,
    },
    paper: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center',
      color: theme.palette.text.secondary,
    },
  });

class Home extends Component {
    constructor(props){
        super(props);
        // Clear current type on home
        store.dispatch(updateCurrentType({currentType: null}));
        store.dispatch(updateCurrentItemId({currentItemId: null}));
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
        store.dispatch(updateNavState({navState: type}));
    }

    render() {
        const { classes } = this.props;

        return (
            <div className={classes.root}>
                <Card className={classes.card}>
                    <CardActionArea>
                        <CardMedia
                            component="img"
                            alt="Projects"
                            className={classes.media}
                            height="194"
                            image={placeholder}
                            title="Projects"
                        />
                        <CardContent>
                            <Typography gutterBottom fontSize={13} fontWeight="regular">
                                PRODUCTS
                            </Typography>
                            <Typography gutterBottom fontSize={21} color="textPrimary" fontWeight="bold">
                                {this.props.projects.length > 0
                                    ? this.props.projects.length + "Projects"
                                    : "No Projects Provided"
                                }
                            </Typography>
                            <Typography className={classes.desc} color="textSecondary" component="p">
                                Lizards are a widespread group of squamate reptiles, with over 6,000 species, ranging
                                across all continents except Antarctica
                            </Typography>
                            <CardActions style={{paddingLeft: '0'}}>
                                <Button size="small" color="primary" style={{fontSize: '15px', textAlign:'left', paddingLeft:'0', marginLeft:'0', justifyContent:'left'}}>
                                    DETAILS
                                </Button>
                                <Button size="small" color="primary" style={{fontSize: '15px', textAlign:'left', paddingLeft:'0', marginLeft:'0', justifyContent:'left'}}>
                                    IMPORT
                                </Button>
                            </CardActions>
                        </CardContent>
                    </CardActionArea>
                    
                </Card>
                <Card className={classes.card}>
                    <CardActionArea>
                        <CardMedia
                            component="img"
                            alt="Products"
                            className={classes.media}
                            height="194"
                            image={placeholder}
                            title="Products"
                        />
                        <CardContent>
                            { this.props.projects.length < 1
                                ? <Paper className={classes.paper}>Add Products</Paper>
                                : <Paper className={classes.paper}>
                                    <Typography>
                                        <Link onClick={(e) => this.handleTypeSelection(e, "products")}
                                            >
                                            {this.props.products.length} Products
                                        </Link>
                                    </Typography>
                                </Paper>
                            }
                        </CardContent>
                    </CardActionArea>
                </Card>
                <Card className={classes.card}>
                    <CardActionArea>
                        <CardMedia
                            component="img"
                            alt="Suppliers"
                            className={classes.media}
                            height="194"
                            image={placeholder}
                            title="Suppliers"
                        />
                        <CardContent>
                            { this.props.projects.length < 1
                                ? <Paper className={classes.paper}>Add Suppliers</Paper>
                                : <Paper className={classes.paper}>
                                    <Typography>
                                        <Link onClick={(e) => this.handleTypeSelection(e, "Suppliers")}
                                            >
                                            {this.props.suppliers.length} Suppliers
                                        </Link>
                                    </Typography>
                                </Paper>
                            }
                        </CardContent>
                    </CardActionArea>
                </Card>
            </div>
        );
  }
}

export default withStyles(styles)(connect(mapState)(Home));