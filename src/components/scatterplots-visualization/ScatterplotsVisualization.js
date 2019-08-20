import React, { Component } from "react";

import ScoresScatterplot from "../../components/scores-scatterplot/ScoresScatterplot";
import { Typography } from "@material-ui/core";

class ScatterplotsVisualization extends Component {
  state = {
    resource: "projects"
  };

  handleResourceChange = event =>
    this.setState({
      resource: event.target.value
    });

  render() {
    return (
      <div>
        <div style={{ marginTop: 24 }}>
          <Typography variant="h5">Projects</Typography>
          <ScoresScatterplot resourceType="projects" />
        </div>
        <div style={{ marginTop: 24 }}>
          <Typography variant="h5">Products</Typography>
          <ScoresScatterplot resourceType="products" />
        </div>
        <div style={{ marginTop: 24 }}>
          <Typography variant="h5">Suppliers</Typography>
          <ScoresScatterplot resourceType="suppliers" />
        </div>
      </div>
    );
  }
}

export default ScatterplotsVisualization;
