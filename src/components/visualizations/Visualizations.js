import React, { Component } from "react";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

import {
  HierarchicalVisualization,
  TreemapVisualization,
  CandlestickVisualization,
  ScatterplotsVisualization
} from "./../../components";

import { withStyles } from "@material-ui/core/styles";

const mapState = state => ({
  suppliers: state.suppliers,
  products: state.products,
  projects: state.projects,
  assets: state.assets,
  suppliersRisk: state.suppliersRisk,
  productsRisk: state.productsRisk,
  projectsRisk: state.projectsRisk,
  scores: state.scores,
  productQuestions: state.productQuestions,
  supplierQuestions: state.supplierQuestions
});

const styles = theme => ({
  tabsRoot: {
    color: "secondary"
  },
  tabsIndicator: {
    backgroundColor: "#12659c",
    color: "#12659c"
  },
  tabRoot: {
    color: "rgba(0,0,0,0.6)",
    textTransform: "uppercase",
    "&:hover": {
      color: "#12659c",
      opacity: 1
    },
    "&$tabSelected": {
      color: "#12659c"
    }
  },
  tabSelected: {}
});

class Visualizations extends Component {
  state = {
    visualization: "hierarchy"
  };

  handleVisualizationChange = (event, viz) => {
    this.setState({ visualization: viz });
  };

  render() {
    const { classes } = this.props;

    return (
      <div>
        <Tabs
          classes={{
            root: classes.tabsRoot,
            indicator: classes.tabsIndicator
          }}
          value={this.state.visualization}
          onChange={this.handleVisualizationChange}
        >
          <Tab value="hierarchy" label="Hierarchy" />
          {/* <Tab value="treemap" label="Tree Map" /> */}
          <Tab value="candlestick" label="Candlestick" />
          <Tab value="scatterplots" label="Scatterplots" />
        </Tabs>
        {this.state.visualization === "hierarchy" && (
          <HierarchicalVisualization />
        )}
        {this.state.visualization === "candlestick" && (
          <CandlestickVisualization />
        )}{" "}
        {this.state.visualization === "scatterplots" && (
          <ScatterplotsVisualization />
        )}
        {/* {this.state.visualization === "treemap" && <TreemapVisualization />} */}
      </div>
    );
  }
}

export default withStyles(styles)(Visualizations);
