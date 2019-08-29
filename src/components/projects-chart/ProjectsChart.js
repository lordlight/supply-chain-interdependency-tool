import OrgChart from "react-orgchart";
import "react-orgchart/index.css";
import Tooltip from "@material-ui/core/Tooltip";

import React, { Component } from "react";

import { connect } from "react-redux";

import { MAX_IMPACT_SCORE } from "../../utils/risk-calculations";

const mapState = state => ({
  projects: state.projects,
  projectsRisk: state.projectsRisk,
  scores: state.scores
});

const ProjectNodeComponent = ({ node }) => {
  const project = node.project || {};
  const scores = node.scores || {};
  const impact =
    (scores.impact !== -Infinity ? scores.impact || 0 : 0) / MAX_IMPACT_SCORE;
  const alarm = impact => {
    if (impact >= 0.75) {
      return "!!!";
    } else if (impact >= 0.5) {
      return "!!";
    } else if (impact >= 0.25) {
      return "!";
    } else {
      return "";
    }
  };
  // const criticality = Math.max(Object.values(risk.Criticality || {})) || 10;
  // const alarm = criticality => {
  //   if (criticality >= 7.5) {
  //     return "!!!";
  //   } else if (criticality >= 5.0) {
  //     return "!!";
  //   } else if (criticality >= 2.5) {
  //     return "!";
  //   } else {
  //     return "";
  //   }
  // };
  return (
    <Tooltip title={project.Name || ""}>
      <div>
        <div
          style={{
            width: project.parent ? 25 : 15,
            height: 15,
            borderRadius: project.parent ? 0 : "50%",
            // backgroundImage: !project.parent
            //   ? "linear-gradient(to bottom right, white, gray)"
            //   : null,
            backgroundColor: project.parent ? "red" : "darkgray",
            border: !project.parent ? "1px solid gray" : 0,
            // opacity: 0.1 + (criticality * 0.8) / 10,
            opacity: 0.1 + impact * 0.8,
            display: "inline-block"
          }}
        />
        {project.parent && (
          <div
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: "black",
              //   opacity: 0.1 + (criticality * 0.8) / 10,
              letterSpacing: 2
            }}
          >
            {alarm(impact)}
          </div>
        )}
      </div>
    </Tooltip>
  );
};

class ProjectsChart extends Component {
  initChartData = () => {
    const projectScores = this.props.scores.project || {};

    const traverse = parent => {
      const node = {
        project: parent,
        // projectRisk: this.props.projectsRisk[parent.ID]
        scores: projectScores[parent.ID] || {}
      };
      node.children = parent.children.map(child => traverse(child));
      return node;
    };
    // there should be exactly one top-level project
    const org = this.props.projects.filter(proj => !proj.parent)[0];
    if (!org) {
      return {};
    }
    return traverse(org);
  };

  render = () => {
    const chartData = this.initChartData();

    return (
      <div
        style={{
          backgroundColor: "#dcdcdc",
          // height: "100%",
          height: 194,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <OrgChart tree={chartData} NodeComponent={ProjectNodeComponent} />
      </div>
    );
  };
}

export default connect(mapState)(ProjectsChart);
