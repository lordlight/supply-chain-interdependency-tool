import React, { Component } from "react";
import ReactDOMServer from "react-dom/server";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import Graph from "react-graph-vis";

import {
  MAX_IMPACT_SCORE,
  computeImpactFromSupplyLines
} from "../../utils/risk-calculations";
import store from "../../redux/store";
import {
  updatePreferences,
  updateNavState,
  updateCurrentType,
  setSelectedResource
} from "../../redux/actions";
import { connect } from "react-redux";

import {
  getCellMultiples,
  getColorScheme,
  ResourcesDesignators
} from "../../utils/general-utils";

const Rainbow = require("rainbowvis.js");

const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

const HIDE_UNCONNECTED_RESOURCES = false;

const RESOURCE_TYPES = {
  P: "projects",
  PR: "products",
  S: "suppliers"
};

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
    justifyContent: "space-between"
  },
  legendText: {
    maxWidth: 125,
    overflow: "hidden"
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
    const colorscheme = getColorScheme(props.preferences);
    this.rainbow.setSpectrum(...colorscheme);
    this.impact_colors = [...Array(101).keys()].map(
      i => `#${this.rainbow.colorAt(i)}`
    );
    this.nodePositions = props.preferences["viz.hierarchical.nodes"] || {};
    this.constructGraph(props);
  }

  resizeTimeout = null;
  resize = () => {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => this.forceUpdate(), 500);
  };

  componentDidMount() {
    window.addEventListener("beforeunload", this.syncProperties);
  }

  syncProperties = () => {
    const { suppliers, products, projects } = this.props;
    if (suppliers.length > 0 && products.length > 0 && projects.length > 0) {
      const nodePositions = this.network.getPositions();
      const scale = this.network.getScale();
      const vp = this.network.getViewPosition();
      const preferences = {
        "viz.hierarchical.scale": scale,
        "viz.hierarchical.position": vp,
        "viz.hierarchical.nodes": nodePositions
      };
      store.dispatch(updatePreferences(preferences));
      ipcRenderer.send("update-preferences", preferences);
    }
  };

  componentWillUnmount() {
    window.removeEventListener("resize", this.resize);
    clearTimeout(this.resizeTimeout);
    this.syncProperties();
    window.removeEventListener("beforeunload", this.syncProperties);
  }

  componentDidUpdate = (prevProps, prevState) => {
    const preferences = (this.props || {}).preferences || {};
    const prevPreferences = (prevProps || {}).preferences || {};
    if (
      preferences["viz.colorscheme"] !== prevPreferences["viz.colorscheme"] ||
      preferences["resources.designators"] !==
        prevPreferences["resource.designators"]
    ) {
      this.nodePositions = this.network.getPositions();
      const scale = this.network.getScale();
      const position = this.network.getViewPosition();
      const moveToOptions = {
        ...(scale && { scale }),
        ...(position && { position })
      };
      this.constructGraph(this.props);
      this.network.setData(this.graph);
      setTimeout(() => this.network.moveTo(moveToOptions), 0);
    }
  };

  getNodePopupContents = (
    type,
    name,
    impact,
    interdependence,
    maxInterdependence,
    assurance,
    showHint = true
  ) => {
    const { classes } = this.props;

    impact = impact !== -Infinity ? impact || 0 : 0;
    interdependence = interdependence !== -Infinity ? interdependence || 0 : 0;
    maxInterdependence =
      maxInterdependence !== -Infinity ? maxInterdependence || 0 : 0;
    assurance = assurance !== -Infinity ? assurance || 0 : 0;

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
              {Math.round(impact)}
            </Typography>
            <div className={classes.scoreBarsContainer}>
              <div
                className={classes.scoreBars}
                style={{
                  width: (impact / MAX_IMPACT_SCORE || 0) * 40
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
              {Math.round(interdependence)}
            </Typography>
            <div className={classes.scoreBarsContainer}>
              <div
                className={classes.scoreBars}
                style={{
                  width: (interdependence / maxInterdependence || 0) * 40
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
              {Math.round(assurance)}
            </Typography>
            <div className={classes.scoreBarsContainer}>
              <div
                className={classes.scoreBars}
                style={{
                  width: (assurance / 100 || 0) * 40
                }}
              />
            </div>
          </div>
        </div>
        {showHint && (
          <Typography
            variant="caption"
            style={{ fontStyle: "italic" }}
          >{`double-click to see ${type} metrics`}</Typography>
        )}
      </div>
    );
  };

  getEdgePopupContents = (
    resource1Type,
    resource1Name,
    resource2Type,
    resource2Name,
    impact,
    interdependence,
    maxInterdependence
  ) => {
    const { classes } = this.props;

    impact = impact !== -Infinity ? impact || 0 : 0;
    interdependence = interdependence !== -Infinity ? interdependence || 0 : 0;
    maxInterdependence =
      maxInterdependence !== -Infinity ? maxInterdependence || 0 : 0;

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
          Supply Line
        </Typography>
        <Typography style={{ fontWeight: "bold" }}>
          {resource1Type}:&nbsp;{resource1Name}
        </Typography>
        {resource2Type && resource2Name && (
          <Typography style={{ fontWeight: "bold" }}>
            {resource2Type}:&nbsp;{resource2Name}
          </Typography>
        )}
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
              {Math.round(impact)}
            </Typography>
            <div className={classes.scoreBarsContainer}>
              <div
                className={classes.scoreBars}
                style={{
                  width: (impact / MAX_IMPACT_SCORE || 0) * 40
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
              {Math.round(interdependence)}
            </Typography>
            <div className={classes.scoreBarsContainer}>
              <div
                className={classes.scoreBars}
                style={{
                  width: (interdependence / maxInterdependence || 0) * 40
                }}
              />
            </div>
          </div>
        </div>
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

    const resourceDesignators = new ResourcesDesignators(preferences);

    const nodePositions = this.nodePositions;

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
        const impact =
          itemScores.impact !== -Infinity ? itemScores.impact || 0 : 0;
        const assurance = itemScores.assurance || 0;
        const impactColor = getImpactColor(impact / MAX_IMPACT_SCORE);
        const value = interdependence / maxProjectInterdependence;
        const title = this.getEdgePopupContents(
          resourceDesignators.get("Project"),
          proj.Name,
          null,
          null,
          impact,
          interdependence,
          maxProjectInterdependence,
          assurance
        );
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
            ((this.props.scores.product || {})[prod.ID] || {}).supplyLines ||
            [];
          const slmatches = supplyLines.filter(sl => sl.projectId === prid);
          const maxImpact = computeImpactFromSupplyLines(slmatches);
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
            ((this.props.scores.product || {})[prod.ID] || {}).supplyLines ||
            [];
          const slmatches = supplyLines.filter(sl => sl.projectId === prid);
          const maxImpact = computeImpactFromSupplyLines(slmatches);
          const interdependence = slmatches.reduce(
            (acc, m) => acc + m.score,
            0
          );
          const value = interdependence / maxProjectToProductInterdependence;
          const impactColor = getImpactColor(maxImpact / MAX_IMPACT_SCORE);
          const title = this.getEdgePopupContents(
            resourceDesignators.get("Product"),
            prod.Name,
            resourceDesignators.get("Project"),
            (projectsMap[prid] || {}).Name,
            maxImpact !== -Infinity ? maxImpact : 0,
            interdependence,
            maxProjectToProductInterdependence
          );
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

    const productToSupplierEdgeScores = products
      .map(prod => {
        const supplierIds = getCellMultiples(prod["Supplier ID"] || "");
        const supplierEdges = supplierIds.map(supId => {
          const supplyLines =
            ((this.props.scores.product || {})[prod.ID] || {}).supplyLines ||
            [];
          const slmatches = supplyLines.filter(sl => sl.supplierId === supId);
          const maxImpact = computeImpactFromSupplyLines(slmatches);
          const interdependence = slmatches.reduce(
            (acc, m) => acc + m.score,
            0
          );
          return { maxImpact, interdependence };
        });
        return supplierEdges.filter(Boolean);
      })
      .flat();

    const maxProductToSupplierInterdependence = Math.max(
      ...productToSupplierEdgeScores.map(scores => scores.interdependence)
    );

    const productToSupplierEdges = products
      .map(prod => {
        const supplierIds = getCellMultiples(prod["Supplier ID"] || "");
        const supplierEdges = supplierIds.map(supId => {
          productEdgesSeen.add(prod.ID);
          supplierEdgesSeen.add(supId);
          const supplyLines =
            ((this.props.scores.product || {})[prod.ID] || {}).supplyLines ||
            [];
          const slmatches = supplyLines.filter(sl => sl.supplierId === supId);
          const maxImpact = computeImpactFromSupplyLines(slmatches);
          const interdependence = slmatches.reduce(
            (acc, m) => acc + m.score,
            0
          );
          const value = interdependence / maxProductToSupplierInterdependence;
          const impactColor = getImpactColor(maxImpact / MAX_IMPACT_SCORE);
          const title = this.getEdgePopupContents(
            resourceDesignators.get("Supplier"),
            (suppliersMap[supId] || {}).Name,
            resourceDesignators.get("Product"),
            prod.Name,
            maxImpact !== -Infinity ? maxImpact : 0,
            interdependence,
            maxProductToSupplierInterdependence
          );
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
        return supplierEdges;
      })
      .flat();

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
    const projectNodes = activeProjects.map(proj => {
      const itemScores = resourceScores[proj.ID] || {};
      const impact =
        itemScores.impact !== -Infinity ? itemScores.impact || 0 : 0;
      const impactColor = getImpactColor(impact / MAX_IMPACT_SCORE);
      const interdependence = itemScores.interdependence || 0;
      const assurance = itemScores.assurance || 0;
      const title = this.getNodePopupContents(
        resourceDesignators.get("Project"),
        proj.Name,
        impact,
        interdependence,
        maxInterdependence,
        assurance
      );
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
    const productNodes = activeProducts.map(prod => {
      const itemScores = resourceScores[prod.ID] || {};
      const impact =
        itemScores.impact !== -Infinity ? itemScores.impact || 0 : 0;
      const impactColor = getImpactColor(impact / MAX_IMPACT_SCORE);
      const interdependence = itemScores.interdependence || 0;
      const assurance = itemScores.assurance || 0;
      const title = this.getNodePopupContents(
        resourceDesignators.get("Product"),
        prod.Name,
        impact,
        interdependence,
        maxInterdependence,
        assurance
      );
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
      const impact =
        itemScores.impact !== -Infinity ? itemScores.impact || 0 : 0;
      const impactColor = getImpactColor(impact / MAX_IMPACT_SCORE);
      const interdependence = itemScores.interdependence || 0;
      const assurance = itemScores.assurance || 0;
      const title = this.getNodePopupContents(
        resourceDesignators.get("Supplier"),
        sup.Name,
        impact,
        interdependence,
        maxInterdependence,
        assurance
      );
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
      const impact =
        itemScores.impact !== -Infinity ? itemScores.impact || 0 : 0;
      const impactColor = getImpactColor(impact / MAX_IMPACT_SCORE);
      const interdependence = itemScores.interdependence || 0;
      const assurance = itemScores.assurance || 0;
      const title = this.getNodePopupContents(
        "Organization",
        proj.Name,
        impact,
        interdependence,
        interdependence,
        assurance,
        false
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
        min: 16,
        max: 120
      }
    },
    layout: {
      hierarchical: {
        direction: "UD",
        edgeMinimization: false,
        blockShifting: false,
        levelSeparation: 600,
        nodeSpacing: 150,
        parentCentralization: true
      }
    },
    edges: {
      color: {
        hover: "#00007f",
        highlight: "#00007f"
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

  getNodeDescendents = (n, results) => {
    const connected = this.network.getConnectedNodes(n, "to");
    connected.forEach(c => {
      results.add(c);
      this.getNodeDescendents(c, results);
    });
  };

  firstDraw = true;

  selected = new Set();

  events = {
    doubleClick: props => {
      const target = props.nodes[0];
      if (target) {
        const elements = target.split("_", 2);
        const rtype = elements.shift();
        const rid = elements.join("_");
        const resource = RESOURCE_TYPES[rtype];
        if (resource && rid) {
          if (resource === "projects") {
            const organizationsIds = this.props.projects
              .filter(p => !p.parent)
              .map(o => o.ID);
            if (organizationsIds.indexOf(rid) !== -1) {
              return;
            }
          }
          store.dispatch(
            setSelectedResource({ resourceType: resource, resourceId: rid })
          );
          store.dispatch(
            updateCurrentType({
              currentType: resource
            })
          );
          store.dispatch(updateNavState({ navState: resource }));
        }
      }
    },
    selectNode: props => {
      props.nodes.forEach(n => {
        if (!this.selected.has(n)) {
          this.selected.add(n);
          const descendents = new Set();
          this.getNodeDescendents(n, descendents);
          descendents.forEach(d => this.selected.add(d));
        }
      });
      this.network.selectNodes(Array.from(this.selected));
    },
    deselectNode: props => {
      const nodeSet = new Set(props.nodes);
      Array.from(this.selected).forEach(n => {
        if (!nodeSet.has(n)) {
          this.selected.delete(n);
          const descendents = new Set();
          this.getNodeDescendents(n, descendents);
          descendents.forEach(d => this.selected.delete(d));
        }
      });
      this.network.selectNodes(Array.from(this.selected));
    },
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
    const { classes, preferences } = this.props;

    const colorscheme = getColorScheme(preferences);
    this.rainbow.setSpectrum(...colorscheme);
    this.impact_colors = [...Array(101).keys()].map(
      i => `#${this.rainbow.colorAt(i)}`
    );

    const resourceDesignators = new ResourcesDesignators(preferences);

    return (
      <div
        style={{
          width: "calc(100% - 48px)",
          height: "calc(100% - 208px)",
          position: "fixed",
          visibility: this.state.visible ? "visible" : "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            borderStyle: "solid",
            borderColor: "lightgray",
            borderWidth: 2,
            padding: 6,
            top: 12
          }}
        >
          <div
            style={{
              display: "flex",
              backgroundColor: "#f8f8f8",
              alignItems: "center"
            }}
          >
            <div>
              <div className={classes.legendIcon}>
                <Typography
                  className={classes.legendText}
                >{`${resourceDesignators.get("Project")}:`}</Typography>
                <div style={{ display: "flex" }}>
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
                <Typography
                  className={classes.legendText}
                >{`${resourceDesignators.get("Product")}:`}</Typography>
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
                <Typography
                  className={classes.legendText}
                >{`${resourceDesignators.get("Supplier")}:`}</Typography>
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
                {[...this.impact_colors].reverse().map((c, i) => (
                  <div
                    key={i}
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
          <Button color="primary" onClick={() => this.network.fit()}>
            Re-center Chart
          </Button>
        </div>
        <div
          style={{
            height: "100%"
          }}
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
