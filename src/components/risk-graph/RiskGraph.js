import React, { Component } from 'react';
import Typography from '@material-ui/core/Typography';
import Graph from "react-graph-vis";
import { ForceGraph2D } from 'react-force-graph';

// import store from '../../redux/store';
import { connect } from "react-redux";

const HIDE_UNCONNECTED_RESOURCES = false;

const mapState = state => ({
    suppliers: state.suppliers,
    products: state.products,
    projects: state.projects,
    organizations: state.organizations,
    suppliersRisk: state.suppliersRisk,
    productsRisk: state.productsRisk,
    projectsRisk: state.projectsRisk
});

class RiskGraph extends Component {
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
    }

    componentDidMount() {
        console.log("did mount");
        // this.drawChart();
        const dimensions = this.treeContainer.getBoundingClientRect();
        window.addEventListener("resize", this.resize);
        // this.setState({
        //     translate: {
        //       x: dimensions.width / 2,
        //       y: Math.min(96, dimensions.height / 4)
        //     }
        //   });
    }

    componentWillUnmount(){
        console.log("will unmount");
        window.removeEventListener("resize", this.resize);
        clearTimeout(this.resizeTimeout);
    }

    componentDidUpdate = () => {
        this.constructGraph(this.props);
        // console.log(this.option);
    }
    
    constructGraph = props => {
        const {organizations, projects, products, suppliers} = props;
        const supplierEdgesSeen = new Set();
        const productEdgesSeen = new Set();
        const projectEdgesSeen = new Set();
        const supplierImpactScores = {};

        const projectsMap = {};
        props.projects.forEach(proj => projectsMap[proj.ID] = proj);
        const suppliersMap = {};
        props.suppliers.forEach(sup => suppliersMap[sup.ID] = sup);

        const projectToProjectEdges = projects.map(proj => {
            projectEdgesSeen.add(proj.ID);
            projectEdgesSeen.add(proj.parent.ID);
            const criticality = (((props.projectsRisk[proj.ID] || {}).criticality || {}).default || 0);
            const title = `<div><p>Project Name:&nbsp${proj.Name}</p><p>Project Criticality:&nbsp;${criticality.toFixed(1)}</p></div>`
            return {from: "P_" + proj.parent.ID, to: "P_" + proj.ID, title, value: criticality * 5.0, chosen: {edge: values => values.color = "#7f0000"}}
        });

        // take into account multiple project edges per product
        const projectToProductEdges = products.map(prod => {
            const projectIds = (prod['Project ID'] || "").split(";").filter(pid => !!pid);
            const productRisk = (props.productsRisk[prod.ID] || {}).impact || 0;
            const productEdges = projectIds.map(prid => {
                productEdgesSeen.add(prod.ID);
                projectEdgesSeen.add(prid);
                const key = `projects|${prid}`;
                // const projectCriticality = ((props.projectsRisk[prid] || {}).criticality || {}).default || 0;
                const productCriticality = (((props.productsRisk[prod.ID] || {}).criticality || {})[key] || 0);
                // const supplierRisk = (props.suppliersRisk[prod['Supplier ID']] || {}).impact || 0;
                const risk = productCriticality * productRisk;
                const title = `<div><p>Product Name:&nbsp${prod.Name}</p><p>Project Name:&nbsp;${(projectsMap[prid] || {}).Name}</p><p>Product Risk:&nbsp${risk.toFixed(1)}</p></div>`
                return {from: "P_" + prid, to: "PR_" + prod.ID, title, value: risk / 2.0, chosen: {edge: values => values.color = "#7f0000"}}
            });
            return productEdges;
        }).flat();
        const productToSupplierEdges = products.map(prod => {
            productEdgesSeen.add(prod.ID);
            supplierEdgesSeen.add(prod['Supplier ID']);
            const supId = prod['Supplier ID'];
            const supplierRisk = (props.suppliersRisk[supId] || {}).impact || 0;
            const productRisk = (props.productsRisk[prod.ID] || {}).impact || 0;
            const projectIds = (prod['Project ID'] || "").split(";").filter(pid => !!pid);
            let totalImpactScore = 0;
            projectIds.forEach(prid => {
                const projectCriticality = ((props.projectsRisk[prid] || {}).criticality || {}).default || 0;
                const key = `projects|${prid}`;
                const productCriticality = (((props.productsRisk[prod.ID] || {}).criticality || {})[key] || 0);
                totalImpactScore += (projectCriticality * productCriticality * productRisk * supplierRisk) / 1000;
            });
            supplierImpactScores[supId] = (supplierImpactScores[supId] || 0) + totalImpactScore;
            const title = `<div><p>Supplier Name:&nbsp;${(suppliersMap[supId] || {}).Name}</p><p>Product Name:&nbsp;${prod.Name}</p><p>Supply Chain Impact Score:&nbsp;${totalImpactScore.toFixed(1)}</p></div>`;
            return {from: "PR_" + prod.ID, to: "S_" + supId, title, value: totalImpactScore, chosen: {edge: values => values.color = "#7f0000"}}
        });
        const organizationNodes = organizations.map(org => {
            return {shape: "dot", id: "P_" + org.ID, title: "Organization Name: " + org.Name, size: 35, level: 0}
        });
        let curNodeLevel = 1;
        const projectNodes = projects.filter(pr => HIDE_UNCONNECTED_RESOURCES ? projectEdgesSeen.has(pr.ID) : true).map(proj => {
            const criticality = (((props.projectsRisk[proj.ID] || {}).criticality || {}).default || 0);
            const title = `<div><p>Project Name:&nbsp${proj.Name}</p><p>Project Criticality:&nbsp;${criticality.toFixed(1)}</p></div>`
            const level = Math.max((proj.Level || "").split(".").length - 1, 1);
            curNodeLevel = Math.max(curNodeLevel, level);
            return {id: "P_" + proj.ID, title, group: "projects", value: criticality * 10.0, level: level}
        });
        curNodeLevel++;
        const productNodes = products.filter(p => HIDE_UNCONNECTED_RESOURCES ? productEdgesSeen.has(p.ID) : true).map(prod => {
            const impact = (props.productsRisk[prod.ID] || {}).impact || 0;
            const title = `<div><p>Product Name:&nbsp${prod.Name}</p><p>Question Score:&nbsp${impact.toFixed(1)}</p></div>`
            return {id: "PR_" + prod.ID, title, group: "products", value: impact, level: curNodeLevel}
        });
        curNodeLevel++;
        const supplierNodes = suppliers.filter(s => HIDE_UNCONNECTED_RESOURCES ? supplierEdgesSeen.has(s.ID): true).map(sup => {
            // const impact = "" + ((props.suppliersRisk[sup.ID] || {}).impact || 0).toFixed(1);
            const impact = supplierImpactScores[sup.ID] || 0;
            const title = `<div><p>Supplier Name:&nbsp${sup.Name}</p><p>Supplier Impact Score:&nbsp${impact.toFixed(1)}</p></div>`
            return {id: "S_" + sup.ID, label: impact.toFixed(1), title, group: "suppliers", value: impact, level: curNodeLevel}
        });
        const nodes = [...organizationNodes, ...projectNodes, ...productNodes, ...supplierNodes];
        const edges = [...projectToProjectEdges, ...projectToProductEdges, ...productToSupplierEdges];
        this.graph = {
            nodes,
            edges
        };
    }

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
        physics: {
            enabled: true,
            stabilization: true
        },
        interaction: {
            hover: true,
            tooltipDelay: 100
        },
        // configure: {
        //     enabled: true
        // },
        groups: {
            projects: {shape: "dot", color: "blue"},
            products: {shape: "dot", color: "green"},
            suppliers: {shape: "circle", color: "orange"}
        },
        nodes: {
            scaling: {
                label: {
                    enabled: true
                }
            }
        },
        layout: {
            hierarchical: {
                direction: "UD",
                sortMethod: "directed",
                levelSeparation: 300
            }
        },
        edges: {
            color: {
                // color: "black",
                inherit: false,
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

    render() {
        return <div id="risk-graph" style={{width:"100%", height:"100%", position: "fixed"}} ref={tc => (this.treeContainer = tc)}>
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
                        <Graph graph={this.graph} options={this.options} />
                {/* // <ReactEcharts option={this.option} /> */}
            </div>;
    }
}

export default connect(mapState)(RiskGraph);
