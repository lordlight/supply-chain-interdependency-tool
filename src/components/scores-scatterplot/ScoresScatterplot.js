import React, { Component } from "react";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { Typography } from "@material-ui/core";

import { MAX_IMPACT_SCORE } from "../../utils/risk-calculations";

import store from "../../redux/store";
import {
  updateNavState,
  updateCurrentType,
  setSelectedResource
} from "../../redux/actions";
import { connect } from "react-redux";

const Rainbow = require("rainbowvis.js");

const mapState = state => ({
  suppliers: state.suppliers,
  products: state.products,
  projects: state.projects,
  scores: state.scores
});

class ScoresScatterplot extends Component {
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

  constructData = props => {
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
    return [
      {
        id: resourceType,
        data: Object.values(resources || {}).map(n => {
          return {
            rid: n.ID,
            name: n.Name,
            x: Math.round((resourceScores[n.ID] || {}).impact || 0),
            y: Math.round((resourceScores[n.ID] || {}).interdependence || 0)
          };
        })
      }
    ];
  };

  handleResourceChange = event =>
    this.setState({
      resource: event.target.value
    });

  lastClicked = null;
  lastClickedTimestamp = 0;

  render() {
    const data = this.constructData(this.props);
    return (
      <div
        style={{
          width: 900,
          height: 500,
          backgroundColor: "white",
          marginTop: 12
        }}
      >
        <ResponsiveScatterPlot
          data={data}
          useMesh={false}
          xScale={{ type: "linear", min: 0, max: MAX_IMPACT_SCORE }}
          colors="rgba(18, 101, 156, 0.33)"
          blendMode="multiply"
          nodeSize={16}
          margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
          axisLeft={{
            legend: "interdependence",
            legendPosition: "middle",
            legendOffset: -62
          }}
          axisBottom={{
            legend: "impact",
            legendPosition: "middle",
            legendOffset: 42
          }}
          onClick={(node, event) => {
            const timestamp = new Date().getTime();
            if (
              this.lastClicked === node.data.rid &&
              timestamp - this.lastClickedTimestamp <= 500
            ) {
              store.dispatch(
                setSelectedResource({
                  resourceType: this.props.resourceType,
                  resourceId: this.lastClicked
                })
              );
              store.dispatch(
                updateCurrentType({
                  currentType: this.props.resourceType
                })
              );
              store.dispatch(
                updateNavState({
                  navState: this.props.resourceType
                })
              );
              this.lastClicked = null;
              this.lastClickedTimestamp = 0;
            } else {
              this.lastClicked = node.data.rid;
              this.lastClickedTimestamp = timestamp;
            }
          }}
          tooltip={({ node }) => (
            <div style={{ backgroundColor: "lightgray", padding: 3 }}>
              <Typography style={{ fontWeight: "bold" }}>
                {node.data.name}
              </Typography>
              <Typography>Impact:&nbsp;{node.data.x}</Typography>
              <Typography>Interdependence:&nbsp;{node.data.y}</Typography>
            </div>
          )}
        />
      </div>
    );
  }
}

export default connect(mapState)(ScoresScatterplot);
