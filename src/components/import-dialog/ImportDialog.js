import React, { Component } from "react";
import { connect } from "react-redux";

import store from "../../redux/store";
import { updateImportFile, updateImportState } from "../../redux/actions";

import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
// import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";

// This only works when running electron or as an app (i.e. will not work in browser).
const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

ipcRenderer.on("return-import", (event, response) => {
  if (response && response.length > 0) {
    store.dispatch(updateImportFile({ importFile: response[0] }));
    store.dispatch(updateImportState({ importState: "ready" }));
  }
});

const styles = theme => ({
  dialogDesc: {
    width: 420
  },
  dialogTitle: {
    textTransform: "capitalize",
    fontSize: 21,
    fontWeight: "bold",
    width: 420
  },
  dropTarget: {
    backgroundColor: "#dedede",
    paddingTop: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 420
  },
  importButton: {
    backgroundColor: "#12659c",
    color: "white",
    textTransform: "uppercase",
    width: 166,
    height: 36,
    fontWeight: "normal",
    fontSize: 15
  },
  importText: {
    paddingLeft: 22,
    width: 232,
    height: 28,
    display: "flex",
    alignItems: "center"
  },
  dialogImporting: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column"
  },
  loadingText: {
    textTransform: "capitalize",
    fontSize: 17,
    fontWeight: "normal",
    color: "rgba(0, 0, 0, 0.6)",
    display: "block",
    paddingTop: 12
  },
  actionButton: {
    width: 166
  },
  progressCircle: {
    display: "block"
  }
});

const mapState = state => ({
  importFile: state.importFile,
  importState: state.importState
});

class ImportDialog extends Component {
  dragEnterHandler = event => {
    event.stopPropagation();
    event.preventDefault();
  };

  dragOverHandler = event => {
    event.stopPropagation();
    event.preventDefault();
  };

  dragLeaveHandler = event => {
    event.stopPropagation();
    event.preventDefault();
  };

  dropHandler = event => {
    // Stop default behaviors and propagation.
    event.stopPropagation();
    event.preventDefault();

    // Get the items.
    const dt = event.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      store.dispatch(updateImportFile({ importFile: files[0].path }));
      store.dispatch(updateImportState({ importState: "ready" }));
    }
  };

  importFile = () => {
    let req = {
      type: this.props.type,
      filePath: this.props.importFile,
      keepInactive: true
    };

    // Send the file to the electron main thread.
    store.dispatch(updateImportState({ importState: "importing" }));
    ipcRenderer.send("asynchronous-file-load", req);
  };

  openDialog = event => {
    ipcRenderer.send("open-import");
  };

  render() {
    const { classes } = this.props;

    // const formatHref = "javascript:;"; // TODO If this is to open in a browser, it will have to be handled by the main thread (I think)
    // const formatLink = (
    //   <Link href={formatHref}>File format details/help...</Link>
    // );

    const os = window.navigator.userAgent;
    let fileText = "No file chosen";
    let saveDisabled = true;
    if (this.props.importFile != null) {
      fileText = this.props.importFile;
      if (os.indexOf("Windows") > -1) {
        fileText = fileText.substring(fileText.lastIndexOf("\\") + 1);
      } else {
        fileText = fileText.substring(fileText.lastIndexOf("/") + 1);
      }

      saveDisabled = false;

      // Check for an error with importing the file.
      if (this.props.importState != null) {
        if (this.props.importState.includes("**ERROR**")) {
          fileText =
            fileText + ", " + this.props.importState.replace("**ERROR**", "");
          saveDisabled = true;
        }
      }
    }

    return (
      <Dialog
        open={this.props.open}
        onClose={e => this.props.handleClose(e, "cancel")}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle className={classes.dialogTitle}>
          import {this.props.type}
        </DialogTitle>
        {this.props.importState === "importing" ? (
          <DialogContent className={classes.dialogImporting}>
            <CircularProgress
              className={classes.progressCircle}
              color="secondary"
            />
            <Typography className={classes.loadingText} component="div">
              importing {this.props.type}
            </Typography>
          </DialogContent>
        ) : (
          <div>
            {/* <DialogContent className={classes.dialogDesc}>
              Import CSV file of {this.props.type}. Press the choose file button
              or drag a file here. {formatLink}
            </DialogContent> */}
            <DialogContent className={classes.dialogDesc}>
              Import CSV file of {this.props.type}. Press the choose file button
              or drag a file here.
            </DialogContent>
            <DialogContent
              className={classes.dropTarget}
              onDragEnter={this.dragEnterHandler}
              onDragOver={this.dragOverHandler}
              onDragLeave={this.dragLeaveHandler}
              onDrop={e => this.dropHandler(e, this.props.type)}
            >
              <Button
                className={classes.importButton}
                onClick={e => this.openDialog(e)}
              >
                choose file...
              </Button>
              <Typography
                className={classes.importText}
                style={
                  (this.props.importState || "").includes("**ERROR**")
                    ? { color: "red" }
                    : {}
                }
                component="div"
              >
                {fileText}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                className={classes.actionButton}
                onClick={e => this.props.handleClose(e)}
                color="primary"
              >
                Cancel
              </Button>
              <Button
                className={classes.actionButton}
                onClick={this.importFile}
                color="primary"
                disabled={saveDisabled}
              >
                OK
              </Button>
            </DialogActions>
          </div>
        )}
      </Dialog>
    );
  }
}

export default withStyles(styles)(connect(mapState)(ImportDialog));
