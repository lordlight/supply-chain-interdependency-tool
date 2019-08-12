import React, { Component } from "react";
import Typography from "@material-ui/core/Typography";
import Graph from "react-graph-vis";
import { ForceGraph2D } from "react-force-graph";

import store from "../../redux/store";
import { updatePreferences } from "../../redux/actions";
import { connect } from "react-redux";

import { getCellMultiples } from "../../utils/general-utils";

const electron = window.electron;
const ipcRenderer = electron.ipcRenderer;

const HIDE_UNCONNECTED_RESOURCES = false;

const IMPACT_COLORS = [
  // "rgba(255, 0, 255, 0.5)",
  "#FF00FF",
  "#FC03FC",
  "#FA05FA",
  "#F708F7",
  "#F50AF5",
  "#F20DF2",
  "#F00FF0",
  "#ED12ED",
  "#EA15EA",
  "#E817E8",
  "#E51AE5",
  "#E31CE3",
  "#E01FE0",
  "#DE21DE",
  "#DB24DB",
  "#D827D8",
  "#D629D6",
  "#D32CD3",
  "#D12ED1",
  "#CE31CE",
  "#CB34CB",
  "#C936C9",
  "#C639C6",
  "#C43BC4",
  "#C13EC1",
  "#BF40BF",
  "#BC43BC",
  "#B946B9",
  "#B748B7",
  "#B44BB4",
  "#B24DB2",
  "#AF50AF",
  "#AD52AD",
  "#AA55AA",
  "#A758A7",
  "#A55AA5",
  "#A25DA2",
  "#A05FA0",
  "#9D629D",
  "#9B649B",
  "#986798",
  "#956A95",
  "#936C93",
  "#906F90",
  "#8E718E",
  "#8B748B",
  "#897689",
  "#867986",
  "#837C83",
  "#817E81",
  "#7E817E",
  "#7C837C",
  "#798679",
  "#768976",
  "#748B74",
  "#718E71",
  "#6F906F",
  "#6C936C",
  "#6A956A",
  "#679867",
  "#649B64",
  "#629D62",
  "#5FA05F",
  "#5DA25D",
  "#5AA55A",
  "#58A758",
  "#55AA55",
  "#52AD52",
  "#50AF50",
  "#4DB24D",
  "#4BB44B",
  "#48B748",
  "#46B946",
  "#43BC43",
  "#40BF40",
  "#3EC13E",
  "#3BC43B",
  "#39C639",
  "#36C936",
  "#34CB34",
  "#31CE31",
  "#2ED12E",
  "#2CD32C",
  "#29D629",
  "#27D827",
  "#24DB24",
  "#21DE21",
  "#1FE01F",
  "#1CE31C",
  "#1AE51A",
  "#17E817",
  "#15EA15",
  "#12ED12",
  "#0FF00F",
  "#0DF20D",
  "#0AF50A",
  "#08F708",
  "#05FA05",
  "#03FC03",
  "#00FF00"
];

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
    // this.drawChart();
    // const dimensions = this.treeContainer.getBoundingClientRect();
    // window.addEventListener("resize", this.resize);
    // this.network.on("stabilizationIterationsDone", () => {
    //   this.network.setOptions({ physics: false });
    // });
    // this.setState({
    //     translate: {
    //       x: dimensions.width / 2,
    //       y: Math.min(96, dimensions.height / 4)
    //     }
    //   });
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

  // shouldComponentUpdate = (nextProps, nextState) => {
  //   console.log(this.state.metric, nextState.metric);
  //   if (nextState.metric != this.state.metric) {
  //     Object.entries(this.props.scores).forEach(entry => {
  //       const [key, scores] = entry;
  //       Object.entries(scores).forEach(subentry => {
  //         const [eid, subscores] = subentry;
  //         let nodeid;
  //         if (key === "project") {
  //           nodeid = "P_" + eid;
  //         } else if (key === "product") {
  //           nodeid = "PR_" + eid;
  //         } else if (key === "supplier") {
  //           nodeid = "S_" + eid;
  //         }
  //         console.log("DDDDDDDDDD", nodeid, subscores[nextState.metric] * 10);
  //         console.log(this.network.body);
  //         this.network.body.data.nodes.update({
  //           id: nodeid,
  //           label: subscores[nextState.metric].toFixed(1),
  //           value: subscores[nextState.metric]
  //         });
  //       });
  //     });
  //     return true;
  //   }
  //   return true;
  // };

  componentDidUpdate = (prevProps, prevState) => {
    this.constructGraph(this.props);
  };

  constructGraph = props => {
    const getImpactColor = impactPct => {
      const colorIdx = Math.min(
        Math.floor((1 - impactPct) * IMPACT_COLORS.length),
        IMPACT_COLORS.length - 1
      );
      const impactColor = IMPACT_COLORS[colorIdx];
      return impactColor;
    };

    const { products, suppliers, projects, preferences } = props;

    const nodePositions = preferences["viz.hierarchical.nodes"] || {};
    console.log("NODE POS", nodePositions);

    // const supplyLineImpactScores = [];
    // this is for shadow projects...
    // const accessImpactScores = [];

    const organizations = props.projects.filter(p => !p.parent);
    const myOrganization = organizations[0] || {};
    const assets = props.assets.map(p => {
      return {
        ...p,
        parent: myOrganization,
        "Parent ID": myOrganization.ID
      };
    });
    // const projects = [...shadowProjects, ...props.projects];

    const projectsMap = {};
    const assetsMap = {};
    const suppliersMap = {};
    projects.forEach(proj => (projectsMap[proj.ID] = proj));
    assets.forEach(asset => (assetsMap[asset.ID] = asset));
    suppliers.forEach(sup => (suppliersMap[sup.ID] = sup));

    const supplierEdgesSeen = new Set();
    const productEdgesSeen = new Set();
    const projectEdgesSeen = new Set();
    // const supplierImpactScores = {};

    const maxProjectImpact = Math.max(
      ...projects
        .filter(proj => !!proj.parent)
        .map(proj => {
          const itemScores = (this.props.scores.project || {})[proj.ID] || {};
          return itemScores.impact || 0;
        })
    );
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
        const impactColor = getImpactColor(impact / maxProjectImpact);
        // const value = impact / orgImpact;
        const value = interdependence / maxProjectInterdependence;
        const key = `project|${parentId}`;
        // const criticality =
        //   ((props.projectsRisk[proj.ID] || {}).Criticality || {})[key] || 0;
        const title = `<div><p>Project Name:&nbsp${
          proj.Name
        }</p><p>Impact Score:&nbsp;${impact.toFixed(
          1
        )}</p><p>Interdependence Score:&nbsp;${interdependence.toFixed(
          1
        )}</p></div>`;
        // const title = `<div><p>Project Name:&nbsp${proj.Name}</div>`;
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
    const maxProjectToProductImpact = Math.max(
      ...projectToProductEdgeScores.map(scores => scores.maxImpact)
    );
    const maxProjectToProductInterdependence = Math.max(
      ...projectToProductEdgeScores.map(scores => scores.interdependence)
    );

    const projectToProductEdges = products
      .map(prod => {
        const projectIds = getCellMultiples(prod["Project ID"] || "");
        // const productScore = (props.productsRisk[prod.ID] || {}).score || 0;
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
          // const value = maxImpact / orgImpact;
          const value = interdependence / maxProjectToProductInterdependence;
          const impactColor = getImpactColor(
            maxImpact / maxProjectToProductImpact
          );

          // const value = slmatch.score / orgImpact;
          // const risk = productCriticality * productScore;
          // const title = `<div><p>Product Name:&nbsp${
          //   prod.Name
          // }</p><p>Project Name:&nbsp;${
          //   (projectsMap[prid] || {}).Name
          // }</p><p>Product Impact:&nbsp${risk.toFixed(1)}</p></div>`;
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
    const maxProductToSupplierImpact = Math.max(
      ...productToSupplierEdgeScores.map(scores => scores.maxImpact)
    );
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
      // const value = maxImpact / orgImpact;
      const value = interdependence / maxProductToSupplierInterdependence;
      const impactColor = getImpactColor(
        maxImpact / maxProductToSupplierImpact
      );
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
        // value: totalImpactScore
        // chosen: { edge: values => (values.color = "#7f0000") }
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
    let maxImpact = Math.max(
      ...(activeProjects.map(proj => (resourceScores[proj.ID] || {}).impact) ||
        0)
    );
    const projectNodes = activeProjects.map(proj => {
      // const pkey = `projects|${parentId}`;
      const itemScores = resourceScores[proj.ID] || {};
      const impact = itemScores.impact || 0;
      const impactColor = getImpactColor(impact / maxImpact);
      const interdependence = itemScores.interdependence || 0;
      // const criticality =
      //   ((props.projectsRisk[proj.ID] || {}).criticality || {})[pkey] || 0;
      const title = `<div><p>Project Name:&nbsp${
        proj.Name
      }</p><p>Project Impact Score:&nbsp;${impact.toFixed(
        1
      )}</p><p>Project Interdependence Score:&nbsp;${interdependence.toFixed(
        1
      )}</p></div>`;
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
        // value: impact,
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
    maxImpact = Math.max(
      ...(activeProducts.map(prod => (resourceScores[prod.ID] || {}).impact) ||
        0)
    );
    const productNodes = activeProducts.map(prod => {
      // const qscore = (props.productsRisk[prod.ID] || {}).score || 0;
      // const score =
      //   productSupplyLines[prod.ID].score + productAccessLines[prod.ID].score;
      const itemScores = resourceScores[prod.ID] || {};
      const impact = itemScores.impact || 0;
      const impactColor = getImpactColor(impact / maxImpact);
      const interdependence = itemScores.interdependence || 0;
      const title = `<div><p>Product Name:&nbsp${
        prod.Name
      }</p><p>Product Impact Score:&nbsp${impact.toFixed(
        1
      )}</p><p>Product Interdependence Score:&nbsp${interdependence.toFixed(
        1
      )}</p></div>`;
      const nodeId = "PR_" + prod.ID;
      return {
        id: nodeId,
        label: prod.Name,
        title,
        color: impactColor,
        group: "products",
        // value: impact,
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
    maxImpact = Math.max(
      ...(activeSuppliers.map(sup => (resourceScores[sup.ID] || {}).impact) ||
        0)
    );
    const supplierNodes = activeSuppliers.map(sup => {
      // const impact = supplierImpactScores[sup.ID] || 0;
      // const score =
      //   supplierSupplyLines[sup.ID].score + supplierAccessLines[sup.ID].score;
      const itemScores = resourceScores[sup.ID] || {};
      const impact = itemScores.impact || 0;
      const impactColor = getImpactColor(impact / maxImpact);
      const interdependence = itemScores.interdependence || 0;
      const title = `<div><p>Supplier Name:&nbsp${
        sup.Name
      }</p><p>Supplier Impact Score:&nbsp${impact.toFixed(
        1
      )}</p><p>Supplier Interdependence Score:&nbsp${interdependence.toFixed(
        1
      )}</p></div>`;
      const nodeId = "S_" + sup.ID;
      return {
        id: nodeId,
        label: sup.Name,
        title,
        color: impactColor,
        group: "suppliers",
        // value: impact,
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
      const interdependence = itemScores.interdependence || 0;
      const title = `<div><p>Organization Name:&nbsp${
        proj.Name
      }</p><p>Organization Impact Score:&nbsp;${impact.toFixed(
        1
      )}</p><p>Organization Interdependence Score:&nbsp;${interdependence.toFixed(
        1
      )}</p></div>`;
      const nodeId = "P_" + proj.ID;
      return {
        group: "organizations",
        id: nodeId,
        label: proj.Name,
        title,
        // label: impact.toFixed(1),
        // value: impact,
        value: 2,
        level: 0,
        font: {
          size: 48
        },
        // color: getImpactColor(1),
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

  // constructGraph = props => {
  //     const {projects, products, suppliers} = props;
  //     let x = 0;
  //     const projectNodes = projects.map(proj => {
  //         return {id: "P_" + proj.ID, name: proj.Name, category: "projects", fixed: false, value:10, x: x+=100, y: 200}
  //     });
  //     x = 0;
  //     const productNodes = products.map(prod => {
  //         return {id: "PR_" + prod.ID, name: prod.Name, category: "products", fixed: false, value:10, x: x+= 100, y: 300}
  //     });
  //     x = 0;
  //     const supplierNodes = suppliers.map(sup => {
  //         return {id: "S_" + sup.ID, name: sup.Name, category: "suppliers", fixed: false, value:10, x: x+=100, y: 400}
  //     });
  //     const projectEdges = projects.map(proj => {
  //         return {source: 0, target: "P_" + proj.ID}
  //     });
  //     const projectToProductEdges = products.map(prod => {
  //         return {source: "P_" + prod['Project ID'], target: "PR_" + prod.ID}
  //     });
  //     const productToSupplierEdges = products.map(prod => {
  //         return {source: "PR_" + prod.ID, target: "S_" + prod['Supplier ID']}
  //     });
  //     this.option.series[0].nodes = [ORGANIZATION_NODE, ...projectNodes, ...productNodes, ...supplierNodes];
  //     this.option.series[0].edges = [...projectEdges, ...projectToProductEdges, ...productToSupplierEdges];
  // }

  // ORGANIZATION_NODE = {id: "O_0", name: "Organization", color: "red"};

  // constructGraph = props => {
  //     const {projects, products, suppliers} = props;

  //     const projectNodes = projects.map(proj => {
  //         return {id: "P_" + proj.ID, name: proj.Name, color: "green", level: 3}
  //     });
  //     const productNodes = products.map(prod => {
  //         return {id: "PR_" + prod.ID, name: prod.Name, module: "products", color: "orange", level: 2}
  //     });
  //     const supplierNodes = suppliers.map(sup => {
  //         return {id: "S_" + sup.ID, name: sup.Name, module: "suppliers", color: "blue", level: 3}
  //     });
  //     const projectEdges = projects.map(proj => {
  //         return {target: "O_0", source: "P_" + proj.ID}
  //     });
  //     const projectToProductEdges = products.map(prod => {
  //         return {target: "P_" + prod['Project ID'], source: "PR_" + prod.ID}
  //     });
  //     const productToSupplierEdges = products.map(prod => {
  //         return {target: "PR_" + prod.ID, source: "S_" + prod['Supplier ID']}
  //     });
  //     const nodes = [this.ORGANIZATION_NODE, ...projectNodes, ...productNodes, ...supplierNodes];
  //     const links = [...projectEdges, ...projectToProductEdges, ...productToSupplierEdges];
  //     this.data = {nodes, links};
  // }

  // option = {
  //     legend: {
  //         x: 'left',
  //         data:["projects", "products", "suppliers"]
  //     },
  //     series : [
  //         {
  //             type:'graph',
  //             layout:'force',
  //             name : "Force tree",
  //             ribbonType: false,
  //             categories : [
  //                 {
  //                     name: 'projects',
  //                     itemStyle: {
  //                         normal: {
  //                             color : '#ff7f50'
  //                         }
  //                     }
  //                 },
  //                 {
  //                     name: 'products',
  //                     itemStyle: {
  //                         normal: {
  //                             color : '#6f57bc'
  //                         }
  //                     }
  //                 },
  //                 {
  //                     name: 'suppliers',
  //                     itemStyle: {
  //                         normal: {
  //                             color : '#af0000'
  //                         }
  //                     }
  //                 }
  //             ],
  //             itemStyle: {
  //                 normal: {
  //                     label: {
  //                         show: false
  //                     },
  //                     nodeStyle : {
  //                         brushType : 'both',
  //                         strokeColor : 'rgba(255,215,0,0.6)',
  //                         lineWidth : 1
  //                     }
  //                 }
  //             },
  //             minRadius : 2,
  //             maxRadius : 10,
  //             nodes : this.nodes,
  //             links : this.links
  //         }
  //     ]
  // };

  options = {
    autoResize: true,
    // physics: false,
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
      tooltipDelay: 100
    },
    // configure: {
    //     enabled: true
    // },
    groups: {
      organizations: { shape: "hexagon", color: "gray" },
      projects: { shape: "dot" },
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
        levelSeparation: 300,
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
    // zoom: event => {
    //   const vp = this.network.getViewPosition();
    //   // console.log("ZOOOM", event, vp);
    //   store.dispatch(
    //     updatePreferences({
    //       "viz.hierarchical.scale": event.scale,
    //       "viz.hierarchical.position": vp
    //     })
    //   );
    //   ipcRenderer.send("update-preferences", {
    //     "viz.hierarchical.scale": event.scale,
    //     "viz.hierarchical.position": vp
    //   });
    // },
    dragEnd: event => {
      // console.log("DRAGEEVENTETS", event);
      // console.log("NODE INFO", this.network.getPositions());
      // this.network.storePositions();
      // const vp = this.network.getViewPosition();
      // console.log("DRAG", event, vp);
      // store.dispatch(
      //   updatePreferences({
      //     "viz.hierarchical.position": vp
      //   })
      // );
      // ipcRenderer.send("update-preferences", {
      //   "viz.hierarchical.position": vp
      // });
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
    // stabilized: () => {
    //   this.network.stopSimulation();
    //   this.network.setOptions({
    //     layout: { hierarchical: { enabled: false } }
    //   });
    // },
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

  // componentDidMount = () => {
  //   const scale = this.props.preferences["viz.hierarchical.scale"];
  //   const position = this.props.preferences["viz.hierarchical.position"];
  //   const moveToOptions = {
  //     ...(scale && { scale }),
  //     ...(position && { position })
  //   };
  //   console.log("NETWORK 1", this.network);
  //   setTimeout(() => {
  //     this.network.moveTo(moveToOptions);
  //     console.log("NETWORK 2", this.network);
  //   }, 1000);
  //   console.log("MTO", moveToOptions);
  // };

  render() {
    const { classes } = this.props;

    // console.log("PATH>>>>", storage.getDefaultDataPath());

    // const scale = this.props.preferences["viz.hierarchical.scale"];
    // const position = this.props.preferences["viz.hierarchical.position"];
    // const moveToOptions = {
    //   ...(scale && { scale }),
    //   ...(position && { position })
    // };
    // console.log("MTO", moveToOptions);
    // setTimeout(() => {
    //   this.network.moveTo(moveToOptions);
    // }, 1000);

    return (
      <div
        // id="risk-graph"
        style={{
          width: "100%",
          height: "100%",
          position: "fixed",
          visibility: this.state.visible ? "visible" : "hidden"
        }}
        // ref={tc => (this.treeContainer = tc)}
      >
        {/* <div style={{ display: "inline-flex" }}>
          <ToggleButtonGroup
            value={this.state.metric}
            exclusive
            onChange={this.handleMetric}
          >
            <ToggleButton value="impact">
              <Typography>Impact</Typography>
            </ToggleButton>
            <ToggleButton value="interdependence">
              <Typography>Interdependence</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </div> */}
        {/* <div style={{position:"absolute", margin:24}}>
                    <Typography style={{color:"blue"}}>Projects</Typography>
                    <Typography style={{color:"green"}}>Products</Typography>
                    <Typography style={{color:"orange"}}>Suppliers</Typography>
                </div> */}
        {/* <ForceGraph2D ref={fg => this.fg = fg} style={{width: "100%"}}
        //   ref={el => { this.fg = el; }}
          graphData={this.data}
          dagMode="bu"
          dagLevelDistance={50}
          backgroundColor="#101020"
          linkColor={() => 'rgba(255,255,255,0.2)'}
        //   nodeVal={3}
          nodeRelSize={2}
        //   nodeVal={node => 100 / (node.level + 1)}
        //   nodeLabel="name"
        //   nodeAutoColorBy="module"
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          d3VelocityDecay={0.3}
        /> */}
        <Graph
          graph={this.graph}
          options={this.options}
          events={this.events}
          getNetwork={network => {
            // network.moveTo(moveToOptions);
            this.network = network;
          }}
        />
        {/* // <ReactEcharts option={this.option} /> */}
      </div>
    );
  }
}

export default connect(mapState)(HierarchicalVisualization);
