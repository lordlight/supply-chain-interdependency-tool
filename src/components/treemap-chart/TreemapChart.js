import React, { Component } from "react";
import { ResponsiveTreeMap } from "@nivo/treemap";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import { MAX_IMPACT_SCORE } from "../../utils/risk-calculations";

// import store from '../../redux/store';
import { connect } from "react-redux";

const Rainbow = require("rainbowvis.js");

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

const RESOURCE_NAMES = {
  projects: "Projects",
  products: "Products",
  suppliers: "Suppliers"
};

const theme = {
  fontSize: 11
};

class TreemapChart extends Component {
  constructor(props) {
    super(props);
    this.rainbow = new Rainbow();
    this.rainbow.setSpectrum("#DC143C", "gray", "#228B22");
    this.impact_colors = [...Array(101).keys()].map(
      i => `#${this.rainbow.colorAt(i)}`
    );
  }

  getImpactColor = impactPct => {
    const colorIdx = Math.min(
      Math.floor((1 - impactPct) * this.impact_colors.length),
      this.impact_colors.length - 1
    );
    const impactColor = this.impact_colors[colorIdx];
    return impactColor;
  };

  constructTree = props => {
    const { resourceType, products, suppliers, projects, scores } = props;
    let resources;
    let resourceScores;
    if (resourceType === "products") {
      resources = products;
      resourceScores = scores.product || {};
    } else if (resourceType === "projects") {
      resources = projects.filter(pr => !!pr.parent);
      resourceScores = scores.project || {};
    } else if (resourceType === "suppliers") {
      resources = suppliers;
      resourceScores = scores.supplier || {};
    }
    const children = Object.values(resources || {}).map(pr => {
      return {
        id: pr.ID,
        name: pr.Name,
        impact: Math.round((resourceScores[pr.ID] || {}).impact || 0),
        interdependence: Math.round(
          (resourceScores[pr.ID] || {}).interdependence || 0
        )
      };
    });
    const root = {
      id: resourceType,
      name: RESOURCE_NAMES[resourceType],
      children
    };

    return root;
  };

  handleResourceChange = event =>
    this.setState({
      resource: event.target.value
    });

  render() {
    const root = this.constructTree(this.props);

    return (
      <ResponsiveTreeMap
        root={root}
        identity="id"
        value="interdependence"
        innerPadding={1}
        outerPadding={1}
        // margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        enableLabel={this.props.labels != null ? this.props.labels : true}
        label="name"
        labelSkipSize={12}
        colors={d =>
          d.impact != null
            ? this.getImpactColor(Math.min(d.impact / MAX_IMPACT_SCORE, 1))
            : "white"
        }
        borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        // labelTextColor={{ from: "color", modifiers: [["darker", 2.0]] }}
        labelTextColor="black"
        animate={true}
        motionStiffness={90}
        motionDamping={11}
        // tooltip={({ id, value, color, label }) => {
        //   return (
        //     <strong>
        //       {label || id}: {value}
        //     </strong>
        //   );
        // }}
        tooltip={d => {
          return (
            <React.Fragment>
              <strong>{d.data.name || d.data.id}</strong>
              {d.data.interdependence && d.data.impact && (
                <React.Fragment>
                  <div>Interdependence: {d.data.interdependence}</div>
                  <div>Impact: {d.data.impact}</div>
                </React.Fragment>
              )}
            </React.Fragment>
          );
        }}
        theme={theme}
      />
    );
  }
}

export default connect(mapState)(TreemapChart);
