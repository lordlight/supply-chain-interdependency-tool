import React, { Component } from "react";
import ReactDOMServer from "react-dom/server";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import Graph from "react-graph-vis";
import { ForceGraph2D } from "react-force-graph";

import { MAX_IMPACT_SCORE } from "../../utils/risk-calculations";
import store from "../../redux/store";
import { updatePreferences } from "../../redux/actions";
import { connect } from "react-redux";

import { getCellMultiples } from "../../utils/general-utils";

const Rainbow = require("rainbowvis.js");

const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

const HIDE_UNCONNECTED_RESOURCES = false;

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
  supplierQuestions: state.supplierQuestions,
  preferences: state.preferences
});

const styles = theme => ({
  legendIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: 80
  },
  scoreBarsContainer: {
    height: 15,
    width: 40,
    display: "inline-block",
    verticalAlign: "middle",
    borderStyle: "solid",
    borderColor: "#7f7f7f",
    borderWidth: 1
  },
  scoreBars: {
    height: 15,
    // display: "inline-block",
    backgroundColor: "#7f7f7f",
    verticalAlign: "middle"
  }
});

class HierarchicalVisualization extends Component {
  state = {
    visible: false
  };

  graph = {
    nodes: [],
    edges: []
  };

  data = {
    nodes: [],
    links: []
  };

  constructor(props) {
    super(props);
    this.rainbow = new Rainbow();
    this.rainbow.setSpectrum("#DC143C", "gray", "#228B22");
    this.impact_colors = [...Array(101).keys()].map(
      i => `#${this.rainbow.colorAt(i)}`
    );
    this.constructGraph(props);
  }

  resizeTimeout = null;
  resize = () => {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => this.forceUpdate(), 500);
  };

  componentDidMount() {
    console.log("did mount");
    window.addEventListener("beforeunload", this.syncProperties);
  }

  syncProperties = () => {
    const scale = this.network.getScale();
    const vp = this.network.getViewPosition();
    const nodePositions = this.network.getPositions();
    const preferences = {
      "viz.hierarchical.scale": scale,
      "viz.hierarchical.position": vp,
      "viz.hierarchical.nodes": nodePositions
    };
    store.dispatch(updatePreferences(preferences));
    ipcRenderer.send("update-preferences", preferences);
  };

  componentWillUnmount() {
    console.log("will unmount");
    window.removeEventListener("resize", this.resize);
    clearTimeout(this.resizeTimeout);
    this.syncProperties();
    window.removeEventListener("beforeunload", this.syncProperties);
  }

  componentDidUpdate = (prevProps, prevState) => {
    this.constructGraph(this.props);
  };

  getNodePopupContents = (
    type,
    name,
    impact,
    interdependence,
    maxInterdependence,
    assurance
  ) => {
    const { classes } = this.props;

    return ReactDOMServer.renderToString(
      <div>
        <Typography
          variant="h6"
          style={{
            borderBottomStyle: "solid",
            borderBottomColor: "gray",
            borderBottomWidth: 1
          }}
        >
          {type}
        </Typography>
        <Typography style={{ fontWeight: "bold" }}>{name}</Typography>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <Typography style={{ marginRight: 6 }}>Impact</Typography>
          <div style={{ display: "flex" }}>
            <Typography style={{ marginRight: 6 }}>
              {/* {impact.toFixed(1)} */}
              {Math.round(impact)}
            </Typography>
            <div className={classes.scoreBarsContainer}>
              <div
                className={classes.scoreBars}
                style={{
                  width: ((impact || 0) / MAX_IMPACT_SCORE || 0) * 40
                }}
              />
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <Typography style={{ marginRight: 6 }}>Interdependence</Typography>
          <div style={{ display: "flex" }}>
            <Typography style={{ marginRight: 6 }}>
              {/* {interdependence.toFixed(1)} */}
              {Math.round(interdependence)}
            </Typography>
            <div className={classes.scoreBarsContainer}>
              <div
                className={classes.scoreBars}
                style={{
                  width: ((interdependence || 0) / maxInterdependence || 0) * 40
                }}
              />
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <Typography style={{ marginRight: 6 }}>Assurance</Typography>
          <div style={{ display: "flex" }}>
            <Typography style={{ marginRight: 6 }}>
              {/* {assurance.toFixed(1)} */}
              {Math.round(assurance)}
            </Typography>
            <div className={classes.scoreBarsContainer}>
              <div
                className={classes.scoreBars}
                style={{
                  width: ((assurance || 0) / 100 || 0) * 40
                }}
              />
            </div>
          </div>
        </div>
        {/* <Typography
          variant="caption"
          style={{ fontStyle: "italic" }}
        >{`double-click to see ${type} metrics`}</Typography> */}
      </div>
    );
  };

  constructGraph = props => {
    const getImpactColor = impactPct => {
      const colorIdx = Math.min(
        Math.floor((1 - impactPct) * this.impact_colors.length),
        this.impact_colors.length - 1
      );
      const impactColor = this.impact_colors[colorIdx];
      return impactColor;
    };

    const { products, suppliers, projects, preferences } = props;

    const nodePositions = preferences["viz.hierarchical.nodes"] || {};
    console.log("NODE POS", nodePositions);

    const organizations = props.projects.filter(p => !p.parent);
    const myOrganization = organizations[0] || {};
    const assets = props.assets.map(p => {
      return {
        ...p,
        parent: myOrganization,
        "Parent ID": myOrganization.ID
      };
    });

    const projectsMap = {};
    const assetsMap = {};
    const suppliersMap = {};
    projects.forEach(proj => (projectsMap[proj.ID] = proj));
    assets.forEach(asset => (assetsMap[asset.ID] = asset));
    suppliers.forEach(sup => (suppliersMap[sup.ID] = sup));

    const supplierEdgesSeen = new Set();
    const productEdgesSeen = new Set();
    const projectEdgesSeen = new Set();

    const maxProjectInterdependence = Math.max(
      ...projects
        .filter(proj => !!proj.parent)
        .map(proj => {
          const itemScores = (this.props.scores.project || {})[proj.ID] || {};
          return itemScores.interdependence || 0;
        })
    );

    // only one possible parent
    const projectToProjectEdges = projects
      .filter(proj => !!proj.parent)
      .map(proj => {
        const parentId = proj["Parent ID"];
        projectEdgesSeen.add(proj.ID);
        projectEdgesSeen.add(parentId);
        const itemScores = (this.props.scores.project || {})[proj.ID] || {};
        const interdependence = itemScores.interdependence || 0;
        const impact = itemScores.impact || 0;
        const impactColor = getImpactColor(impact / MAX_IMPACT_SCORE);
        const value = interdependence / maxProjectInterdependence;
        const title = `<div><p>Project Name:&nbsp${
          proj.Name
        }</p><p>Impact Score:&nbsp;${impact.toFixed(
          1
        )}</p><p>Interdependence Score:&nbsp;${interdependence.toFixed(
          1
        )}</p></div>`;
        return {
          from: "P_" + parentId,
          to: "P_" + proj.ID,
          title,
          value,
          color: {
            color: impactColor
          }
        };
      });

    const projectToProductEdgeScores = products
      .map(prod => {
        const projectIds = getCellMultiples(prod["Project ID"] || "");
        return projectIds.map(prid => {
          const supplyLines =
            (this.props.scores.product[prod.ID] || {}).supplyLines || [];
          const slmatches = supplyLines.filter(sl => sl.projectId === prid);
          const maxImpact = Math.max(...slmatches.map(m => m.score || 0));
          const interdependence = slmatches.reduce(
            (acc, m) => acc + m.score,
            0
          );
          return { maxImpact, interdependence };
        });
      })
      .flat();

    const maxProjectToProductInterdependence = Math.max(
      ...projectToProductEdgeScores.map(scores => scores.interdependence)
    );

    const projectToProductEdges = products
      .map(prod => {
        const projectIds = getCellMultiples(prod["Project ID"] || "");
        const productEdges = projectIds.map(prid => {
          const key = `project|${prid}`;
          const productCriticality =
            ((props.productsRisk[prod.ID] || {}).Criticality || {})[key] || 0;
          if (productCriticality === 0) {
            return null;
          }
          productEdgesSeen.add(prod.ID);
          projectEdgesSeen.add(prid);

          const supplyLines =
            (this.props.scores.product[prod.ID] || {}).supplyLines || [];
          const slmatches = supplyLines.filter(sl => sl.projectId === prid);
          const maxImpact = Math.max(...slmatches.map(m => m.score || 0));
          const interdependence = slmatches.reduce(
            (acc, m) => acc + m.score,
            0
          );
          const value = interdependence / maxProjectToProductInterdependence;
          const impactColor = getImpactColor(maxImpact / MAX_IMPACT_SCORE);
          const title = `<div><p>Product Name:&nbsp${
            prod.Name
          }</p><p>Project Name:&nbsp;${
            (projectsMap[prid] || {}).Name
          }</p><p>Impact Score:&nbsp;${maxImpact.toFixed(
            1
          )}</p><p>Interdependence Score:&nbsp;${interdependence.toFixed(
            1
          )}</p></div>`;
          return {
            from: "P_" + prid,
            to: "PR_" + prod.ID,
            title,
            value,
            color: {
              color: impactColor
            }
          };
        });
        return productEdges.filter(Boolean);
      })
      .flat();

    const productToSupplierEdgeScores = products.map(prod => {
      const supId = prod["Supplier ID"];
      const supplyLines =
        (this.props.scores.product[prod.ID] || {}).supplyLines || [];
      const slmatches = supplyLines.filter(sl => sl.supplierId === supId);
      const maxImpact = Math.max(...slmatches.map(m => m.score || 0));
      const interdependence = slmatches.reduce((acc, m) => acc + m.score, 0);
      return { maxImpact, interdependence };
    });

    const maxProductToSupplierInterdependence = Math.max(
      ...productToSupplierEdgeScores.map(scores => scores.interdependence)
    );

    const productToSupplierEdges = products.map(prod => {
      productEdgesSeen.add(prod.ID);
      const supId = prod["Supplier ID"];
      supplierEdgesSeen.add(supId);

      const supplyLines =
        (this.props.scores.product[prod.ID] || {}).supplyLines || [];
      const slmatches = supplyLines.filter(sl => sl.supplierId === supId);
      const maxImpact = Math.max(...slmatches.map(m => m.score || 0));
      const interdependence = slmatches.reduce((acc, m) => acc + m.score, 0);
      const value = interdependence / maxProductToSupplierInterdependence;
      const impactColor = getImpactColor(maxImpact / MAX_IMPACT_SCORE);
      const title = `<div><p>Supplier Name:&nbsp;${
        (suppliersMap[supId] || {}).Name
      }</p><p>Product Name:&nbsp;${
        prod.Name
      }</p><p>Impact Score:&nbsp;${maxImpact.toFixed(
        1
      )}</p><p>Interdependence Score:&nbsp;${interdependence.toFixed(
        1
      )}</p></div>`;
      return {
        from: "PR_" + prod.ID,
        to: "S_" + supId,
        title,
        value,
        color: {
          color: impactColor
        }
      };
    });
    let curNodeLevel = 1;
    const activeProjects = projects
      .filter(pr => !!pr.parent)
      .filter(pr =>
        HIDE_UNCONNECTED_RESOURCES ? projectEdgesSeen.has(pr.ID) : true
      );
    let resourceScores = this.props.scores.project || {};
    let maxInterdependence = Math.max(
      ...(activeProjects.map(
        proj => (resourceScores[proj.ID] || {}).interdependence
      ) || 0)
    );
    let maxAssurance = Math.max(
      ...(activeProjects.map(
        proj => (resourceScores[proj.ID] || {}).assurance
      ) || 0)
    );
    const projectNodes = activeProjects.map(proj => {
      const itemScores = resourceScores[proj.ID] || {};
      const impact = itemScores.impact || 0;
      const impactColor = getImpactColor(impact / MAX_IMPACT_SCORE);
      const interdependence = itemScores.interdependence || 0;
      const assurance = itemScores.assurance || 0;
      const title = this.getNodePopupContents(
        "Project",
        proj.Name,
        impact,
        interdependence,
        maxInterdependence,
        assurance,
        maxAssurance
      );
      // const title = `<div><p>Project Name:&nbsp${
      //   proj.Name
      // }</p><p>Project Impact Score:&nbsp;${impact.toFixed(
      //   1
      // )}</p><p>Project Interdependence Score:&nbsp;${interdependence.toFixed(
      //   1
      // )}</p></div>`;
      const level = Math.max((proj.Level || "").split(".").length - 1, 1);
      curNodeLevel = Math.max(curNodeLevel, level);
      const nodeId = "P_" + proj.ID;
      return {
        id: nodeId,
        label: proj.Name,
        title,
        color: impactColor,
        group: "projects",
        value: interdependence / maxInterdependence || 0,
        level: level,
        widthConstraint: {
          maximum: 160
        },
        font: {
          size: 32
        },
        ...nodePositions[nodeId]
      };
    });

    curNodeLevel++;
    const activeProducts = products.filter(p =>
      HIDE_UNCONNECTED_RESOURCES ? productEdgesSeen.has(p.ID) : true
    );
    resourceScores = this.props.scores.product || {};

    maxInterdependence = Math.max(
      ...(activeProducts.map(
        prod => (resourceScores[prod.ID] || {}).interdependence
      ) || 0)
    );
    maxAssurance = Math.max(
      ...(activeProducts.map(
        prod => (resourceScores[prod.ID] || {}).assurance
      ) || 0)
    );
    const productNodes = activeProducts.map(prod => {
      const itemScores = resourceScores[prod.ID] || {};
      const impact = itemScores.impact || 0;
      const impactColor = getImpactColor(impact / MAX_IMPACT_SCORE);
      const interdependence = itemScores.interdependence || 0;
      const assurance = itemScores.assurance || 0;
      const title = this.getNodePopupContents(
        "Product",
        prod.Name,
        impact,
        interdependence,
        maxInterdependence,
        assurance,
        maxAssurance
      );
      // const title = `<div><p>Product Name:&nbsp${
      //   prod.Name
      // }</p><p>Product Impact Score:&nbsp${impact.toFixed(
      //   1
      // )}</p><p>Product Interdependence Score:&nbsp${interdependence.toFixed(
      //   1
      // )}</p></div>`;
      const nodeId = "PR_" + prod.ID;
      return {
        id: nodeId,
        label: prod.Name,
        title,
        color: impactColor,
        group: "products",
        value: interdependence / maxInterdependence || 0,
        level: curNodeLevel,
        widthConstraint: {
          maximum: 160
        },
        font: {
          size: 32
        },
        ...nodePositions[nodeId]
      };
    });
    curNodeLevel++;
    const activeSuppliers = suppliers.filter(s =>
      HIDE_UNCONNECTED_RESOURCES ? supplierEdgesSeen.has(s.ID) : true
    );
    resourceScores = this.props.scores.supplier || {};
    maxInterdependence = Math.max(
      ...(activeSuppliers.map(
        sup => (resourceScores[sup.ID] || {}).interdependence
      ) || 0)
    );
    const supplierNodes = activeSuppliers.map(sup => {
      const itemScores = resourceScores[sup.ID] || {};
      const impact = itemScores.impact || 0;
      const impactColor = getImpactColor(impact / MAX_IMPACT_SCORE);
      const interdependence = itemScores.interdependence || 0;
      const assurance = itemScores.assurance || 0;
      const title = this.getNodePopupContents(
        "Supplier",
        sup.Name,
        impact,
        interdependence,
        maxInterdependence,
        assurance
      );
      // const title = `<div><p>Supplier Name:&nbsp${
      //   sup.Name
      // }</p><p>Supplier Impact Score:&nbsp${impact.toFixed(
      //   1
      // )}</p><p>Supplier Interdependence Score:&nbsp${interdependence.toFixed(
      //   1
      // )}</p></div>`;
      const nodeId = "S_" + sup.ID;
      return {
        id: nodeId,
        label: sup.Name,
        title,
        color: impactColor,
        group: "suppliers",
        value: interdependence / maxInterdependence || 0,
        level: curNodeLevel,
        widthConstraint: {
          maximum: 160
        },
        font: {
          size: 32
        },
        ...nodePositions[nodeId]
      };
    });
    resourceScores = this.props.scores.project || {};
    const organizationNodes = organizations.map(proj => {
      const itemScores = resourceScores[proj.ID] || {};
      const impact = itemScores.impact || 0;
      const impactColor = getImpactColor(impact / MAX_IMPACT_SCORE);
      const interdependence = itemScores.interdependence || 0;
      const assurance = itemScores.assurance || 0;

      // const title = `<div><p style="font-weight:bold;">Organization</p><p>${
      //   proj.Name
      // }</p><p>Impact:&nbsp;${impact.toFixed(
      //   1
      // )}</p><p>Interdependence:&nbsp;${interdependence.toFixed(1)}</p></div>`;
      // const title = ReactDOMServer.renderToString(
      //   <div>
      //     <p style={{ fontWeight: "bold" }}>Organization</p>
      //   </div>
      // );
      const title = this.getNodePopupContents(
        "Organization",
        proj.Name,
        impact,
        interdependence,
        interdependence,
        assurance,
        assurance
      );
      const nodeId = "P_" + proj.ID;
      return {
        group: "organizations",
        id: nodeId,
        label: proj.Name,
        title,
        value: 2,
        level: 0,
        font: {
          size: 48
        },
        color: impactColor,
        ...nodePositions[nodeId]
      };
    });
    const nodes = [
      ...organizationNodes,
      ...projectNodes,
      ...productNodes,
      ...supplierNodes
    ];
    const edges = [
      ...projectToProjectEdges,
      ...projectToProductEdges,
      ...productToSupplierEdges
    ];
    this.graph = {
      nodes,
      edges
    };
  };

  options = {
    autoResize: true,
    physics: {
      enabled: true,
      stabilization: true,
      repulsion: {
        nodeDistance: 200
      },
      hierarchicalRepulsion: {
        nodeDistance: 240
      }
    },
    interaction: {
      hover: true,
      multiselect: true,
      tooltipDelay: 100
    },
    groups: {
      organizations: { shape: "hexagon" },
      projects: { shape: "hexagon" },
      products: { shape: "square" },
      suppliers: { shape: "triangle" }
    },
    nodes: {
      scaling: {
        label: {
          enabled: true
        },
        min: 5,
        max: 120
      }
    },
    layout: {
      hierarchical: {
        direction: "UD",
        sortMethod: "directed",
        levelSeparation: 600,
        nodeSpacing: 150,
        parentCentralization: false
      }
    },
    edges: {
      color: {
        hover: "#7f0000",
        highlight: "#7f0000"
      },
      scaling: {
        max: 10
      },
      arrows: {
        to: {
          enabled: false
        },
        from: {
          enabled: false
        }
      }
    }
  };

  firstDraw = true;

  events = {
    stabilized: () => {
      if (this.firstDraw) {
        const scale = this.props.preferences["viz.hierarchical.scale"];
        const position = this.props.preferences["viz.hierarchical.position"];
        const moveToOptions = {
          ...(scale && { scale }),
          ...(position && { position })
        };
        this.network.moveTo(moveToOptions);
        this.network.stopSimulation();
        this.network.setOptions({
          layout: { hierarchical: { enabled: false } }
        });
        this.firstDraw = false;
        setTimeout(() => this.setState({ visible: true }), 0);
        console.log("NETWORK", this.network);
      }
    },
    startStabilizing: () => {
      if (!this.firstDraw) {
        this.network.stopSimulation();
      }
    }
  };

  handleMetric = (event, newMetric) => {
    if (newMetric != null) {
      this.setState({ metric: newMetric });
    }
  };

  handleVisualizationChange = (event, viz) => {
    this.setState({ visualization: viz });
  };

  render() {
    const { classes } = this.props;

    return (
      <div
        style={{
          width: "calc(100% - 48px)",
          height: "calc(100% - 208px)",
          position: "fixed",
          // display: "flex",
          // flexDirection: "column",
          // flex: "1 1",
          visibility: this.state.visible ? "visible" : "hidden"
        }}
      >
        {/* <div
          style={{
            display: "flex",
            position: "absolute",
            width: "100%",
            height: 120,
            zIndex: 100,
            alignItems: "center",
            justifyContent: "space-between"
          }}
        > */}
        <div
          style={{
            position: "absolute",
            borderStyle: "solid",
            borderColor: "lightgray",
            borderWidth: 2,
            padding: 6,
            top: 12
            // bottom: 6
            // zIndex: 100
          }}
        >
          {/* <Typography variant="h6">Legend</Typography> */}
          <div
            style={{
              display: "flex",
              // borderStyle: "solid",
              // borderColor: "lightgray",
              // borderWidth: 2,
              // padding: 6,
              backgroundColor: "#f8f8f8",
              alignItems: "center"
            }}
          >
            <div>
              <div className={classes.legendIcon}>
                <Typography>Project:</Typography>
                <div>
                  <div
                    style={{
                      float: "left",
                      borderRight: "5.5px solid gray",
                      borderTop: "9.5px solid transparent",
                      borderBottom: "9.5px solid transparent"
                    }}
                  />
                  <div
                    style={{
                      float: "left",
                      width: 11,
                      height: 19,
                      backgroundColor: "gray"
                    }}
                  />
                  <div
                    style={{
                      float: "left",
                      borderLeft: "5.5px solid gray",
                      borderTop: "9.5px solid transparent",
                      borderBottom: "9.5px solid transparent"
                    }}
                  />
                </div>
              </div>
              <div className={classes.legendIcon}>
                <Typography>Product:</Typography>
                <div
                  style={{
                    width: 22,
                    height: 17,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}
                >
                  <div
                    style={{
                      width: 17,
                      height: 17,
                      backgroundColor: "gray"
                    }}
                  />
                </div>
              </div>
              <div className={classes.legendIcon}>
                <Typography>Supplier:</Typography>
                <div
                  style={{
                    width: 0,
                    borderBottom: "17px solid gray",
                    borderLeft: "9.8px solid transparent",
                    borderRight: "9.8px solid transparent"
                  }}
                />
              </div>
            </div>
            <div style={{ marginLeft: 24 }}>
              <Typography>Impact</Typography>
              <div style={{ display: "flex" }}>
                {[...this.impact_colors].reverse().map(c => (
                  <div
                    key={c}
                    style={{ width: 2, height: 9, backgroundColor: c }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: this.impact_colors.length * 2
                }}
              >
                <Typography variant="caption">low</Typography>
                <Typography variant="caption">high</Typography>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", zIndex: 100, right: 0 }}>
          <Button
            // variant="contained"
            color="primary"
            onClick={() => this.network.fit()}
          >
            Re-center Chart
          </Button>
        </div>
        {/* </div> */}
        <div
          style={{
            height: "100%"
            // height: "calc(100% - 84px)"
          }}
          // style={{
          //   flex: "1 1 100%",
          //   display: "flex",
          //   flexDirecton: "column",
          //   justifyContent: "center",
          //   alignItems: "center"
          // }}
        >
          <Graph
            graph={this.graph}
            options={this.options}
            events={this.events}
            getNetwork={network => {
              this.network = network;
            }}
          />
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(connect(mapState)(HierarchicalVisualization));
