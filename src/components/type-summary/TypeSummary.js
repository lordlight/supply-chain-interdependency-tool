import React, { Component } from "react";

import { withStyles } from "@material-ui/core/styles";

import Typography from "@material-ui/core/Typography";

import { connect } from "react-redux";

import {
  getNumQuestionsForResource,
  ResourcesDesignators
} from "../../utils/general-utils";

const mapState = state => ({
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
  projectResponses: state.projectResponses,
  preferences: state.preferences
});

const styles = theme => ({
  heading: {
    fontSize: 25,
    textTransform: "capitalize"
  },
  inactive: {
    fontSize: 16,
    color: "gray"
  }
});

class TypeSummary extends Component {
  render() {
    const { classes, preferences = {} } = this.props;

    const resourceDesignators = new ResourcesDesignators(preferences);

    const type = this.props.currentType;
    let items = [], itemsInactive = [], questions, responses, typeDisplay;

    if (type === "suppliers") {
      items = [...this.props.suppliers];
      itemsInactive = [...this.props.suppliersInactive];
      questions = this.props.supplierQuestions;
      responses = this.props.supplierResponses;
      typeDisplay = resourceDesignators.getPlural("supplier");
    } else if (type === "products") {
      items = [...this.props.products];
      itemsInactive = [...this.props.productsInactive];
      questions = this.props.productQuestions;
      responses = this.props.productResponses;
      typeDisplay = resourceDesignators.getPlural("product");
    } else if (type === "projects") {
      items = [...this.props.projects].filter(proj => !!proj.parent);
      itemsInactive = [...this.props.projectsInactive];
      questions = this.props.projectQuestions;
      responses = this.props.projectResponses;
      typeDisplay = resourceDesignators.getPlural("project");
    }

    let numCompleted = 0,
      numPartial = 0,
      numZero = 0;

    items.forEach(item => {
      let numResp = Object.keys(responses[item.ID] || []).length;
      const numQuestions = getNumQuestionsForResource(item, questions);
      if (numResp >= numQuestions) {
        numCompleted += 1;
      } else if (numResp > 0) {
        numPartial += 1;
      } else {
        numZero += 1;
      }
    });

    let title;
    if (items.length === 0) {
      title = (
        <Typography gutterBottom className={classes.heading}>
          {`No ${typeDisplay} provided`}
        </Typography>
      );
    } else if (itemsInactive.length > 0) {
      title = (
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <Typography gutterBottom className={classes.heading}>
            {items.length} {typeDisplay}
          </Typography>
          <Typography gutterBottom className={classes.inactive}>
            &nbsp;(+ {itemsInactive.length} inactive)
          </Typography>
          <Typography gutterBottom className={classes.heading}>
            :
          </Typography>
        </div>
      );
    } else {
      title = (
        <Typography gutterBottom className={classes.heading}>
          {items.length} {typeDisplay}:
        </Typography>
      );
    }
    return (
      <React.Fragment>
        {title}
        {items.length > 0 && (
          <React.Fragment>
            <Typography className={classes.complete} component="div">
              {numCompleted} {typeDisplay} with complete data
            </Typography>
            <Typography className={classes.partial} component="div">
              {numPartial} {typeDisplay} with partial data
            </Typography>
            <Typography className={classes.zero} component="div">
              {numZero} {typeDisplay} with no data
            </Typography>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(connect(mapState)(TypeSummary));
