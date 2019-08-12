import React, { Component } from "react";
import { ResponsiveTreeMap } from "@nivo/treemap";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

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

const theme = {
  fontSize: 11
};

const RESOURCE_NAMES = {
  project: "Projects",
  product: "Products",
  supplier: "Suppliers"
};

class TreemapVisualization extends Component {
  state = {
    resource: "project"
  };

  constructor(props) {
    super(props);
    this.rainbow = new Rainbow();
    this.rainbow.setSpectrum("red", "yellow", "green");
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
    const { products, suppliers, projects, scores } = props;
    let resources;
    if (this.state.resource === "product") {
      resources = products;
    } else if (this.state.resource === "project") {
      resources = projects.filter(pr => !!pr.parent);
    } else if (this.state.resource === "supplier") {
      resources = suppliers;
    }
    const children = Object.values(resources || {}).map(pr => {
      return {
        id: pr.ID,
        name: pr.Name,
        impact: Math.round(
          ((scores[this.state.resource] || {})[pr.ID] || {}).impact || 0
        ),
        interdependence: Math.round(
          ((scores[this.state.resource] || {})[pr.ID] || {}).interdependence ||
            0
        )
      };
    });
    const root = {
      id: this.state.resource,
      name: RESOURCE_NAMES[this.state.resource],
      // impact: 0.5,
      // impact: 0,
      children
    };

    return root;
  };

  handleResourceChange = event =>
    this.setState({
      resource: event.target.value
    });

  render() {
    const { classes } = this.props;

    const root = this.constructTree(this.props);
    const maxImpact = Math.max(
      ...Object.values(this.props.scores[this.state.resource] || {}).map(
        entry => entry.impact || 0
      )
    );

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
              <MenuItem value="project">Projects</MenuItem>
              <MenuItem value="product">Products</MenuItem>
              <MenuItem value="supplier">Suppliers</MenuItem>
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
          <ResponsiveTreeMap
            root={root}
            identity="id"
            value="interdependence"
            innerPadding={3}
            outerPadding={3}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            label="name"
            // labelFormat=".0s"
            labelSkipSize={12}
            // colors={{ datum: IMPACT_COLORS }}
            colors={d =>
              d.impact != null
                ? this.getImpactColor(Math.min(d.impact / maxImpact, 1))
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
        </div>
      </React.Fragment>
    );
  }
}

export default connect(mapState)(TreemapVisualization);
