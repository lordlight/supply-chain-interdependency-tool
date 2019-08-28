import React, { Component } from "react";

import ScoresScatterplot from "../../components/scores-scatterplot/ScoresScatterplot";
import { Typography } from "@material-ui/core";

import { ResourcesDesignators } from "../../utils/general-utils";

import { connect } from "react-redux";

const mapState = state => ({
  preferences: state.preferences
});

class ScatterplotsVisualization extends Component {
  state = {
    resource: "projects"
  };

  handleResourceChange = event =>
    this.setState({
      resource: event.target.value
    });

  render() {
    const resourceDesignators = new ResourcesDesignators(
      this.props.preferences
    );

    return (
      <div>
        <div style={{ marginTop: 24 }}>
          <Typography variant="h5">
            {resourceDesignators.getPlural("Project")}
          </Typography>
          <Typography>
            This plot shows all {resourceDesignators.getPlural("project")} by
            impact (x axis) and interdependence (y axis).{" "}
            {resourceDesignators.getPlural("Project")} in the upper right of
            this plot should be given attention before those in the lower left.
          </Typography>
          <ScoresScatterplot resourceType="projects" />
        </div>
        <div style={{ marginTop: 24 }}>
          <Typography variant="h5">
            {resourceDesignators.getPlural("Product")}
          </Typography>
          <Typography>
            This plot shows all {resourceDesignators.getPlural("product")} by
            impact (x axis) and interdependence (y axis).{" "}
            {resourceDesignators.getPlural("Product")} near the x = y line
            (impact = interdependence) are those that have one{" "}
            {resourceDesignators.get("supplier")} and are used in one{" "}
            {resourceDesignators.get("project")}.{" "}
            {resourceDesignators.getPlural("Product")} above this line are part
            of multiple supply lines: supplied by more than one{" "}
            {resourceDesignators.get("supplier")} and/or used in more than one{" "}
            {resourceDesignators.get("project")}.{" "}
            {resourceDesignators.getPlural("Product")} in the upper right of
            this plot should be given attention before those in the lower left.
          </Typography>
          <ScoresScatterplot resourceType="products" />
        </div>
        <div style={{ marginTop: 24 }}>
          <Typography variant="h5">
            {resourceDesignators.getPlural("Supplier")}
          </Typography>
          <Typography>
            This plot shows all {resourceDesignators.getPlural("supplier")} by
            impact (x axis) and interdependence (y axis).{" "}
            {resourceDesignators.getPlural("Supplier")} in the upper right of
            this plot should be given attention before those in the lower left.
          </Typography>
          <ScoresScatterplot resourceType="suppliers" />
        </div>
      </div>
    );
  }
}

export default connect(mapState)(ScatterplotsVisualization);
