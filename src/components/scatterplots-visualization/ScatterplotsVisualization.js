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
          <ScoresScatterplot resourceType="projects" />
        </div>
        <div style={{ marginTop: 24 }}>
          <Typography variant="h5">
            {resourceDesignators.getPlural("Product")}
          </Typography>
          <ScoresScatterplot resourceType="products" />
        </div>
        <div style={{ marginTop: 24 }}>
          <Typography variant="h5">
            {resourceDesignators.getPlural("Supplier")}
          </Typography>
          <ScoresScatterplot resourceType="suppliers" />
        </div>
      </div>
    );
  }
}

export default connect(mapState)(ScatterplotsVisualization);
