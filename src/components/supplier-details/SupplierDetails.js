import React, { Component } from "react";

import { withStyles } from "@material-ui/core/styles";

import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

import { connect } from "react-redux";

// properties we've added that user does not need to see
const KNOWN_ITEM_ANNOTATIONS = ["_cscrm_active"];

const mapState = state => ({
  currentType: state.currentType,
  suppliers: state.suppliers,
  suppliersInactive: state.suppliersInactive,
  products: state.products,
  productsInactive: state.productsInactive,
  projects: state.projects,
  projectsInactive: state.projectsInactive,
  supplierQuestions: state.supplierQuestions,
  productQuestions: state.productQuestions,
  projectQuestions: state.projectQuestions,
  supplierResponses: state.supplierResponses,
  productResponses: state.productResponses,
  projectResponses: state.projectResponses
});

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

class SupplierDetails extends Component {
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
    const { classes, supplier = {} } = this.props;

    let {
      Name: name,
      "Street Address": streetAddress,
      City: city,
      State: state,
      Zip: zip,
      Website: website,
      ID: supplierId,
      "Contact Name": contactName,
      "Contact Email": contactEmail,
      "Contact Phone": contactPhone,
      ...additionalDetails
    } = supplier;
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
    const hasContact = contactName || contactEmail || contactPhone;
    let colSize;
    if (hasContact && hasAdditionalDetails) {
      colSize = 4;
    } else if (hasContact || hasAdditionalDetails) {
      colSize = 6;
    } else {
      colSize = 12;
    }
    const hasAddress = city || state || zip;

    return (
      <Grid container direction="row" spacing={16}>
        <Grid item xs={12} sm={colSize}>
          <Grid container direction="column" spacing={16}>
            <Grid item>
              <Typography className={classes.heading} component="div">
                {name}
              </Typography>
              {streetAddress && (
                <Typography className={classes.content} component="div">
                  {streetAddress}
                </Typography>
              )}
              {hasAddress && (
                <Typography className={classes.content} component="div">
                  {city}, {state} {zip}
                </Typography>
              )}
            </Grid>
            <Grid item>
              {website && (
                <Typography className={classes.content} component="div">
                  {website}
                </Typography>
              )}
              <Typography className={classes.content} component="div">
                Supplier ID: {supplierId}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        {hasContact && (
          <Grid item xs={12} sm={colSize}>
            <Typography
              className={classes.heading}
              component="div"
              style={{ marginBottom: 16 }}
            >
              Contact:
            </Typography>
            {contactName && (
              <Typography className={classes.content} component="div">
                {contactName}
              </Typography>
            )}
            {contactEmail && (
              <Typography className={classes.content} component="div">
                {contactEmail}
              </Typography>
            )}
            {contactPhone && (
              <Typography className={classes.content} component="div">
                {contactPhone}
              </Typography>
            )}
          </Grid>
        )}
        {hasAdditionalDetails && (
          <Grid item xs={12} sm={colSize}>
            {!this.state.allDetails && (
              <Button
                variant="contained"
                size="large"
                color="primary"
                onClick={this.showAllDetails}
              >
                All Supplier Details...
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

export default withStyles(styles)(connect(mapState)(SupplierDetails));
