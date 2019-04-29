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
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import store from '../../redux/store';
import { connect } from "react-redux";
import { updateCurrentType, updateImportFile, updateNavState } from "../../redux/actions";

// Images
import placeholder from "../../imgs/placeholder.png";
import suppliersImg from "../../imgs/suppliers.png";
import productsImg from "../../imgs/products.png";
import projectsImg from "../../imgs/projects.png";

// This only works when running electron or as an app (i.e. will not work in browser).
const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

ipcRenderer.on('return-import', (event, response) => {
    if (response.length > 0){
        store.dispatch(updateImportFile({importFile: response[0]}));
    }
});

const mapState = state => ({
    importFile: state.importFile
});

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
    title: {
        fontSize: 13,
        fontWeight: "regular",
        textTransform: "uppercase",
    },
    heading: {
        fontSize: 25,
        textTransform: 'capitalize',
    },
    dialogDesc: {
        width: 420,
    },
    dialogTitle: {
        textTransform: 'capitalize',
        fontSize: 21,
        fontWeight: 'bold',
        width: 420,
    },
    dropTarget: {
        backgroundColor: '#dedede',
        paddingTop: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 420,
    },
    importButton: {
        backgroundColor: '#12659c',
        color: 'white',
        textTransform: 'uppercase',
        width: 166,
        height: 36,
        fontWeight: 'normal',
        fontSize: 15,
    },
    importText: {
        paddingLeft: 22,
        width: 232,
        height: 28,
        display: 'flex',
        alignItems: 'center',
    },
    actionButton: {
        width: 166,
    }
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
        store.dispatch(updateImportFile({importFile: null}));
    };

    handleTypeSelection = (event, type) => {
        store.dispatch(updateCurrentType({currentType: type}));
        store.dispatch(updateNavState({navState: type}));
    }

    openDialog = (event) => {
        ipcRenderer.send('open-import');
    }

    render() {
        const { classes } = this.props;

        let tempImg = placeholder;
        if (this.props.type === "suppliers"){
            tempImg = suppliersImg;
        } else if (this.props.type === "products"){
            tempImg = productsImg;
        } else if (this.props.type === "projects"){
            tempImg = projectsImg;
        }

        const formatHref = "javascript:;";
        const formatLink = <Link href={formatHref}>File format details/help...</Link>;

        const os = window.navigator.userAgent;
        let fileText = "No file chosen";
        let saveDisabled = true;
        if (this.props.importFile != null){
            fileText = this.props.importFile;
            if (os.indexOf("Windows") > -1){
                fileText = fileText.substring(fileText.lastIndexOf("\\")+1);
            } else {
                fileText = fileText.substring(fileText.lastIndexOf("/")+1);
            }
            
            saveDisabled = false;
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
                        title={this.props.type}
                    />
                    <CardContent>
                        <Typography gutterBottom className={classes.title}>
                            {this.props.type}
                        </Typography>
                        <Typography gutterBottom className={classes.heading}>
                            {this.props.items.length > 0
                                ? this.props.items.length + " " + this.props.type
                                : "No " + this.props.type + " provided"
                            }
                        </Typography>
                        <Typography className={classes.desc} color="textSecondary" component="p">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor 
                            incididunt ut labore et dolore magna aliqua.
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <Button
                            size="small"
                            color="primary"
                            style={{fontSize: '15px', textAlign:'left', justifyContent:'left'}}
                            onClick={(e) => this.handleTypeSelection(e, this.props.type)}
                        >
                            DETAILS...
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
                    <DialogTitle className={classes.dialogTitle}>import {this.props.type}</DialogTitle>
                    <DialogContent className={classes.dialogDesc}>
                        Import CSV file of {this.props.type}. Press the choose file button or drag a file here. {formatLink}
                    </DialogContent>
                    <DialogContent
                      className={classes.dropTarget}
                      onDragEnter={this.dragEnterHandler}
                      onDragOver={this.dragOverHandler}
                      onDragLeave={this.dragLeaveHandler}
                      onDrop={(e) => this.dropHandler(e, this.props.type)}
                    >
                        <Button
                          className={classes.importButton}
                          onClick={(e) => this.openDialog(e)}
                        >
                            choose file...
                        </Button>
                        <Typography className={classes.importText} component="div">
                            {fileText}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button
                          className={classes.actionButton}
                          onClick={(e) => this.handleClose(e, 'cancel')}
                          color="primary"
                        >
                            Cancel
                        </Button>
                        <Button
                          className={classes.actionButton}
                          onClick={(e) => this.handleClose(e, 'save')}
                          color="primary"
                          disabled={saveDisabled}
                        >
                            OK
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default withStyles(styles)(connect(mapState)(TypeCard));