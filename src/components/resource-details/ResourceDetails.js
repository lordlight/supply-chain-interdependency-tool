import React, { Component } from "react";

import { withStyles } from "@material-ui/core/styles";

import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

// properties we've added that user does not need to see
const KNOWN_ITEM_ANNOTATIONS = ["_cscrm_active"];

const styles = theme => ({
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "rgba(0, 0, 0, 0.54)"
  },
  content: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.54)"
  }
});

class ResourceDetails extends Component {
  state = {
    dialogOpen: false,
    allDetails: false
  };

  handleClose = () => {
    this.setState({ dialogOpen: false });
  };

  showAllDetails = () => {
    this.setState({ allDetails: true });
  };

  render() {
    const { classes, ignore = [], resourceName, resource = {} } = this.props;

    let { ID: resourceId, Name: name, ...additionalDetails } = resource;
    ignore.forEach(i => delete additionalDetails[i]);
    KNOWN_ITEM_ANNOTATIONS.forEach(k => delete additionalDetails[k]);

    additionalDetails = Object.entries(additionalDetails)
      .filter(entry => entry[1] != null && entry[1] !== "")
      .sort((a, b) => {
        if (a[0] < b[0]) {
          return -1;
        } else if (a[0] > b[0]) {
          return 1;
        } else {
          return 0;
        }
      });
    const hasAdditionalDetails = additionalDetails.length > 0;
    const colSize = hasAdditionalDetails ? 6 : 12;

    return (
      <Grid container direction="row" spacing={16}>
        <Grid item xs={12} sm={colSize}>
          <Grid container direction="column" spacing={16}>
            <Grid item>
              <Typography className={classes.heading} component="div">
                {name}
              </Typography>
            </Grid>
            <Grid item>
              <Typography className={classes.content} component="div">
                {resourceName} ID: {resourceId}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        {hasAdditionalDetails && (
          <Grid item xs={12} sm={colSize}>
            {!this.state.allDetails && (
              <Button
                variant="contained"
                size="large"
                color="primary"
                onClick={this.showAllDetails}
              >
                All {resourceName} Details...
              </Button>
            )}
            {this.state.allDetails && (
              <div>
                <Typography className={classes.heading} component="div">
                  Additional Details
                </Typography>
                {additionalDetails.map(entry => (
                  <Typography
                    key={entry[0]}
                    className={classes.content}
                    component="div"
                  >
                    {entry[0]}: {entry[1]}
                  </Typography>
                ))}
              </div>
            )}
          </Grid>
        )}
      </Grid>
    );
  }
}

export default withStyles(styles)(ResourceDetails);
