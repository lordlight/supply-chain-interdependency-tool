import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import store from '../../redux/store';
import { updateCurrentType, updateNavState } from "../../redux/actions";

// Images
import placeholder from "../../imgs/placeholder.png";
import suppliersImg from "../../imgs/suppliers.png";
import productsImg from "../../imgs/products.png";
import projectsImg from "../../imgs/projects.png";

// This only works when running electron or as an app (i.e. will not work in browser).
const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

function getModalStyle() {
    const top = 50;
    const left = 50;

    return {
        top: `${top}%`,
        left: `${left}%`,
        transform: `translate(-${top}%, -${left}%)`,
    };
}

const styles = theme => ({
    card: {
        display:"inline-flex",
        flexShrink: 0,
        flexGrow: 0,
        flexDirection: 'column',
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
        position: 'absolute',
        width: theme.spacing.unit * 50,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        padding: theme.spacing.unit * 4,
        outline: 'none',
    },
  });

class TypeCard extends Component {
    state = {
        open: false,
        dragHovering: false,
    }

    dragEnterHandler = (event) => {
        console.log("drag enter");
        this.state.dragHovering = true;
        event.stopPropagation();
        event.preventDefault();
    }

    dragOverHandler = (event) => {
        console.log("drag over");
        event.stopPropagation();
        event.preventDefault();
    }

    dragLeaveHandler = (event) => {
        console.log("drag leave");
        event.stopPropagation();
        event.preventDefault();
        this.state.dragHovering = false;
    }

    dropHandler = (event, type) => {
        console.log("drop");
        this.state.dragHovering = false;
        // Stop default behaviors and propagation.
        event.stopPropagation();
        event.preventDefault();
        
        // Get the items.
        const dt = event.dataTransfer;
        const files = dt.files;

        let req = {type: type, filesToLoad: []};

        for (let i = 0; i < files.length; i++){
            req.filesToLoad.push({name: files[i].name, path:files[i].path});
        }

        console.log("files to load: ", req.filesToLoad);

        // Send the file to the electron main thread.
        ipcRenderer.send('asynchronous-file-load', req);
    }

    handleOpen = () => {
        this.setState({ open: true });
    };

    handleClose = (event, closeType) => {
        this.setState({ open: false });
        console.log("close type: ", closeType);
    };

    handleTypeSelection = (event, type) => {
        store.dispatch(updateCurrentType({currentType: type}));
        store.dispatch(updateNavState({navState: type}));
    }

    render() {
        const { classes } = this.props;

        let tempImg = placeholder;
        if (this.props.type === "suppliers"){
            tempImg = suppliersImg;
        } else if (this.props.type === "products"){
            tempImg = productsImg;
        } if (this.props.type === "projects"){
            tempImg = projectsImg;
        }

        return (
            <div>
                <Card className={classes.card}>
                    <CardMedia
                        component="img"
                        alt="Projects"
                        className={classes.media}
                        height="194"
                        image={tempImg}
                        title="Projects"
                    />
                    <CardContent>
                        <Typography gutterBottom fontSize={13} fontWeight="regular">
                            {this.props.type}
                        </Typography>
                        <Typography gutterBottom fontSize={21} color="textPrimary" fontWeight="bold">
                            {this.props.items.length > 0
                                ? this.props.items.length + " " + this.props.type
                                : "No " + this.props.type + " provided"
                            }
                        </Typography>
                        <Typography className={classes.desc} color="textSecondary" component="p">
                            Lizards are a widespread group of squamate reptiles, with over 6,000 species, ranging
                            across all continents except Antarctica
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <Button
                            size="small"
                            color="primary"
                            style={{fontSize: '15px', textAlign:'left', justifyContent:'left'}}
                            onClick={(e) => this.handleTypeSelection(e, this.props.type)}
                        >
                            DETAILS
                        </Button>
                        <Button
                            size="small"
                            color="primary"
                            style={{fontSize: '15px', textAlign:'left', justifyContent:'left'}}
                            onClick={() => this.handleOpen()}
                        >
                            IMPORT...
                        </Button>
                    </CardActions>
                </Card>
                <Dialog
                    open={this.state.open}
                    onClose={(e) => this.handleClose(e, 'cancel')}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                    >
                    <DialogTitle id="alert-dialog-title">{this.props.type} import</DialogTitle>
                    <DialogContent>
                        <DialogContent id="alert-dialog-description">
                            <Paper
                              className="modal-paper"
                              elevation={1}
                              style={{height: "200px"}}
                              onDragEnter={this.dragEnterHandler}
                              onDragOver={this.dragOverHandler}
                              onDragLeave={this.dragLeaveHandler}
                              onDrop={(e) => this.dropHandler(e, this.props.type)}
                            >
                                <Typography id="modal-title">
                                    Drag and drop the {this.props.type} file here
                                </Typography>
                            </Paper>
                        </DialogContent>
                    </DialogContent>
                    <DialogActions>
                        <Button
                          onClick={(e) => this.handleClose(e, 'cancel')}
                          color="primary"
                        >
                            Cancel
                        </Button>
                        <Button
                          onClick={(e) => this.handleClose(e, 'save')}
                          color="primary"
                          autoFocus
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default withStyles(styles)(TypeCard);