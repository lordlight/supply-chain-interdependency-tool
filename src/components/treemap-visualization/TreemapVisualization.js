import React, { Component } from "react";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import TreemapChart from "../../components/treemap-chart/TreemapChart";

class TreemapVisualization extends Component {
  state = {
    resource: "projects"
  };

  handleResourceChange = event =>
    this.setState({
      resource: event.target.value
    });

  render() {
    return (
      <React.Fragment>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <FormControl style={{ minWidth: 240, margin: 12 }}>
            <InputLabel htmlFor="resource">Resource Type</InputLabel>
            <Select
              value={this.state.resource}
              onChange={this.handleResourceChange}
              inputProps={{
                name: "resource",
                id: "resource"
              }}
            >
              <MenuItem value="projects">Projects</MenuItem>
              <MenuItem value="products">Products</MenuItem>
              <MenuItem value="suppliers">Suppliers</MenuItem>
            </Select>
          </FormControl>
        </div>
        <div
          id="risk-graph"
          style={{
            width: "calc(100% - 48px)",
            height: "calc(100% - 288px)",
            position: "fixed"
          }}
          ref={tc => (this.treeContainer = tc)}
        >
          <TreemapChart resourceType={this.state.resource} />
        </div>
      </React.Fragment>
    );
  }
}

export default TreemapVisualization;
