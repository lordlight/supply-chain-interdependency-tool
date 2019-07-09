import React, { Component } from "react";
import Typography from "@material-ui/core/Typography";
import Graph from "react-graph-vis";
import { ForceGraph2D } from "react-force-graph";

import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";

// import store from '../../redux/store';
import { connect } from "react-redux";

import { getCellMultiples } from "../../utils/general-utils";

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
  supplierQuestions: state.supplierQuestions
});

class RiskGraph extends Component {
  state = {
    metric: "impact"
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

  componentWillUnmount() {
    console.log("will unmount");
    window.removeEventListener("resize", this.resize);
    clearTimeout(this.resizeTimeout);
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
    if (prevState.metric != this.state.metric && this.network) {
      // this.network.setData(this.graph.nodes, this.graph.edges);
      Object.entries(this.props.scores).forEach(entry => {
        const [key, scores] = entry;
        Object.entries(scores).forEach(subentry => {
          const [eid, subscores] = subentry;
          let nodeid, group;
          if (key === "project") {
            nodeid = "P_" + eid;
            // group = "projects";
          } else if (key === "product") {
            nodeid = "PR_" + eid;
            // group = "products";
          } else if (key === "supplier") {
            nodeid = "S_" + eid;
            // group = "suppliers";
          }
          this.network.body.data.nodes.update({
            id: nodeid,
            // group,
            // label: subscores[this.state.metric].toFixed(1),
            value: subscores[this.state.metric]
            // scaling: {
            //   label: {
            //     enabled: true
            //   },
            //   min: 10,
            //   max: 50
            //   // customScalingFuncion: (min, max, total, value) => {
            //   //   if (max === min) {
            //   //     return 0.5;
            //   //   } else {
            //   //     var scale = 1 / (max - min);
            //   //     return Math.max(0, (value - min) * scale);
            //   //   }
            //   // }
            // }
          });
        });
      });
      // console.log(this.network);
      // this.network.redraw();
    }
    // this.constructGraph(this.props);
    // console.log(this.option);
  };

  constructGraph = props => {
    const addSupplyLine = (allSupplyLines, supplyLine) => {
      if (allSupplyLines) {
        allSupplyLines.supplyLines.push(supplyLine);
      }
    };

    const { products, suppliers, projects } = props;

    // const supplyLineImpactScores = [];
    // this is for shadow projects...
    // const accessImpactScores = [];

    const organizations = props.projects.filter(p => !p.parent);
    const assets = props.assets.map(p => {
      return {
        ...p,
        parent: organizations[0],
        "Parent ID": (organizations[0] || {}).ID
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

    // only one possible parent
    const projectToProjectEdges = projects.map(proj => {
      const parentId = proj["Parent ID"];
      projectEdgesSeen.add(proj.ID);
      projectEdgesSeen.add(parentId);
      const key = `project|${parentId}`;
      const criticality =
        ((props.projectsRisk[proj.ID] || {}).Criticality || {})[key] || 0;
      const title = `<div><p>Project Name:&nbsp${
        proj.Name
      }</p><p>Project Criticality:&nbsp;${criticality.toFixed(1)}</p></div>`;
      // const title = `<div><p>Project Name:&nbsp${proj.Name}</div>`;
      return {
        from: "P_" + parentId,
        to: "P_" + proj.ID,
        title
        // value: criticality * 5.0
        // value: criticality
        // chosen: { edge: values => (values.color = "#7f0000") }
      };
    });

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
          }</p></div>`;
          return {
            from: "P_" + prid,
            to: "PR_" + prod.ID,
            title
            // value: risk / 2.0
          };
        });
        return productEdges.filter(Boolean);
      })
      .flat();

    const productToSupplierEdges = products.map(prod => {
      productEdgesSeen.add(prod.ID);
      supplierEdgesSeen.add(prod["Supplier ID"]);
      const supId = prod["Supplier ID"];

      const title = `<div><p>Supplier Name:&nbsp;${
        (suppliersMap[supId] || {}).Name
      }</p><p>Product Name:&nbsp;${prod.Name}</p></div>`;
      return {
        from: "PR_" + prod.ID,
        to: "S_" + supId,
        title
        // value: totalImpactScore
        // chosen: { edge: values => (values.color = "#7f0000") }
      };
    });
    let curNodeLevel = 1;
    const projectNodes = projects
      .filter(pr => !!pr.parent)
      .filter(pr =>
        HIDE_UNCONNECTED_RESOURCES ? projectEdgesSeen.has(pr.ID) : true
      )
      .map(proj => {
        const parentId = proj["Parent ID"];
        // const pkey = `projects|${parentId}`;
        const impact = this.props.scores.project[proj.ID].impact;
        const exposure = this.props.scores.project[proj.ID].exposure;
        // const criticality =
        //   ((props.projectsRisk[proj.ID] || {}).criticality || {})[pkey] || 0;
        const title = `<div><p>Project Name:&nbsp${
          proj.Name
        }</p><p>Project Impact Score:&nbsp;${impact.toFixed(
          1
        )}</p><p>Project Exposure Score:&nbsp;${exposure.toFixed(1)}</p></div>`;
        const level = Math.max((proj.Level || "").split(".").length - 1, 1);
        curNodeLevel = Math.max(curNodeLevel, level);
        return {
          id: "P_" + proj.ID,
          title,
          group: "projects",
          value: impact,
          level: level
          // label: impact.toFixed(1)
        };
      });

    curNodeLevel++;
    const productNodes = products
      .filter(p =>
        HIDE_UNCONNECTED_RESOURCES ? productEdgesSeen.has(p.ID) : true
      )
      .map(prod => {
        // const qscore = (props.productsRisk[prod.ID] || {}).score || 0;
        // const score =
        //   productSupplyLines[prod.ID].score + productAccessLines[prod.ID].score;
        const impact = this.props.scores.product[prod.ID].impact;
        const exposure = this.props.scores.product[prod.ID].exposure;
        const title = `<div><p>Product Name:&nbsp${
          prod.Name
        }</p><p>Product Impact Score:&nbsp${impact.toFixed(
          1
        )}</p><p>Product Exposure Score:&nbsp${exposure.toFixed(1)}</p></div>`;
        return {
          id: "PR_" + prod.ID,
          title,
          group: "products",
          value: impact,
          level: curNodeLevel
          // label: impact.toFixed(1)
        };
      });
    curNodeLevel++;
    const supplierNodes = suppliers
      .filter(s =>
        HIDE_UNCONNECTED_RESOURCES ? supplierEdgesSeen.has(s.ID) : true
      )
      .map(sup => {
        // const impact = supplierImpactScores[sup.ID] || 0;
        // const score =
        //   supplierSupplyLines[sup.ID].score + supplierAccessLines[sup.ID].score;
        const impact = this.props.scores.supplier[sup.ID].impact;
        const exposure = this.props.scores.supplier[sup.ID].exposure;
        const title = `<div><p>Supplier Name:&nbsp${
          sup.Name
        }</p><p>Supplier Impact Score:&nbsp${impact.toFixed(
          1
        )}</p><p>Supplier Exposure Score:&nbsp${exposure.toFixed(1)}</p></div>`;
        return {
          id: "S_" + sup.ID,
          // label: impact.toFixed(1),
          title,
          group: "suppliers",
          value: impact,
          level: curNodeLevel
        };
      });
    const organizationNodes = organizations.map(proj => {
      const impact = this.props.scores.project[proj.ID].impact;
      const exposure = this.props.scores.project[proj.ID].exposure;
      const title = `<div><p>Organization Name:&nbsp${
        proj.Name
      }</p><p>Organization Impact Score:&nbsp;${impact.toFixed(
        1
      )}</p><p>Organization Exposure Score:&nbsp;${exposure.toFixed(
        1
      )}</p></div>`;
      return {
        group: "organizations",
        id: "P_" + proj.ID,
        title,
        // label: impact.toFixed(1),
        value: impact,
        level: 0
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
        nodeDistance: 200
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
      organizations: { shape: "dot" },
      projects: { shape: "dot", color: "lightblue" },
      products: { shape: "dot", color: "lightgreen" },
      suppliers: { shape: "dot", color: "orange" }
    },
    nodes: {
      scaling: {
        label: {
          enabled: true
        },
        min: 5,
        max: 50
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

  handleMetric = (event, newMetric) => {
    if (newMetric != null) {
      this.setState({ metric: newMetric });
    }
  };

  render() {
    return (
      <div
        id="risk-graph"
        style={{ width: "100%", height: "100%", position: "fixed" }}
        ref={tc => (this.treeContainer = tc)}
      >
        <div style={{ display: "inline-flex" }}>
          <ToggleButtonGroup
            value={this.state.metric}
            exclusive
            onChange={this.handleMetric}
          >
            <ToggleButton value="impact">
              <Typography>Impact</Typography>
            </ToggleButton>
            <ToggleButton value="exposure">
              <Typography>Exposure</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
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
          getNetwork={network => (this.network = network)}
        />
        {/* // <ReactEcharts option={this.option} /> */}
      </div>
    );
  }
}

export default connect(mapState)(RiskGraph);
