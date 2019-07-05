import OrgChart from "react-orgchart";
import "react-orgchart/index.css";
import Tooltip from "@material-ui/core/Tooltip";

import React, { Component } from "react";

import { connect } from "react-redux";

const mapState = state => ({
  projects: state.projects,
  projectsRisk: state.projectsRisk
});

const BUCKETS = ["0-20", "20-40", "40-60", "60-80", "80-100"];

const data = {
  labels: ["low", "", "", "", "high"],
  datasets: [
    {
      backgroundColor: [
        "rgba(255, 0, 0, 0.2)",
        "rgba(255, 0, 0, 0.4)",
        "rgba(255, 0, 0, 0.6)",
        "rgba(255, 0, 0, 0.8)",
        "rgba(255, 0, 0, 1.0)"
      ],
      data: [5, 6, 4, 3, 2]
    }
  ]
};

const options = {
  plugins: {
    datalabels: {
      display: true
    }
  },
  animation: false,
  layout: {
    padding: {
      left: 12,
      right: 12,
      top: 24,
      bottom: 0
    }
  },
  responsive: false,
  maintainAspectRatio: false,
  legend: {
    display: false
  },
  tooltips: {
    enabled: true,
    callbacks: {
      label: tooltipItem => `${tooltipItem.value} Projets`,
      title: tooltipItem => {
        console.log(tooltipItem[0]);
        const bucket = `${BUCKETS[tooltipItem[0].index]} score`;
        return bucket;
      }
    }
  },
  scales: {
    xAxes: [
      {
        // display: false,
        categoryPercentage: 1.0,
        barPercentage: 1.0
      }
    ],
    yAxes: [
      {
        ticks: {
          beginAtZero: true,
          stepSize: 1,
          maxTicksLimit: 50,
          display: false
        },
        scaleLabel: {
          display: true,
          labelString: "# Projects"
        }
      }
    ]
  }
};

const ProjectNodeComponent = ({ node }) => {
  const project = node.project || {};
  const risk = node.projectRisk || {};
  const criticality = Math.max(Object.values(risk.Criticality || {})) || 10;
  const alarm = criticality => {
    if (criticality >= 7.5) {
      return "!!!";
    } else if (criticality >= 5.0) {
      return "!!";
    } else if (criticality >= 2.5) {
      return "!";
    } else {
      return "";
    }
  };
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
            opacity: 0.1 + (criticality * 0.8) / 10,
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
            {alarm(criticality)}
          </div>
        )}
      </div>
    </Tooltip>
  );
};

class ProjectsChart extends Component {
  initChartData = () => {
    const traverse = parent => {
      const node = {
        project: parent,
        projectRisk: this.props.projectsRisk[parent.ID]
      };
      node.children = parent.children.map(child => traverse(child));
      return node;
    };
    // console.log("<><><", this.props.projects);
    // there should be exactly one top-level project
    const org = this.props.projects.filter(proj => !proj.parent)[0];
    if (!org) {
      return {};
    }
    return traverse(org);
  };

  render = () => {
    const chartData = this.initChartData();
    // const buckets = [0, 0, 0, 0, 0];
    // Object.values(this.props.projectsRisk).map(risk => Object.values(risk.criticality).reduce((total, x) => total + x, 0) || 10).forEach(crit => {
    //     const bucket = Math.min(Math.floor(crit / 2), 4);
    //     buckets[bucket]++;
    // });
    // data.datasets[0].data = buckets;
    // options.scales.yAxes[0].ticks.max = (this.props.projects || []).length;
    // return <div style={{backgroundColor: "#dcdcdc"}}>
    //     <Bar data={data} options={options} height={194} width={344}></Bar>
    // </div>

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
