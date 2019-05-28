import React, { Component } from 'react';
import Typography from '@material-ui/core/Typography';
import Graph from "react-graph-vis";
import { ForceGraph2D } from 'react-force-graph';

// import store from '../../redux/store';
import { connect } from "react-redux";

const HIDE_UNCONNECTED_RESOURCES = true;

const mapState = state => ({
    suppliers: state.suppliers,
    products: state.products,
    projects: state.projects,
    organizations: state.organizations
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

        const projectToProjectEdges = projects.map(proj => {
            projectEdgesSeen.add(proj.ID);
            projectEdgesSeen.add(proj.parent.ID);
            return {from: "P_" + proj.parent.ID, to: "P_" + proj.ID}
        });
        // take into account multiple project edges per product
        const projectToProductEdges = products.map(prod => {
            const projectIds = (prod['Project ID'] || "").split(";").filter(pid => !!pid);
            const productEdges = projectIds.map(prid => {
                productEdgesSeen.add(prod.ID);
                projectEdgesSeen.add(prid);
                return {from: "P_" + prid, to: "PR_" + prod.ID}
            });
            return productEdges;
        }).flat();
        const productToSupplierEdges = products.map(prod => {
            productEdgesSeen.add(prod.ID);
            supplierEdgesSeen.add(prod['Supplier ID']);
            return {from: "PR_" + prod.ID, to: "S_" + prod['Supplier ID']}
        });
        const organizationNodes = organizations.map(org => {
            return {id: "P_" + org.ID, title: org.Name}
        });
        const projectNodes = projects.filter(pr => HIDE_UNCONNECTED_RESOURCES ? projectEdgesSeen.has(pr.ID) : true).map(proj => {
            return {id: "P_" + proj.ID, title: proj.Name, group: "projects"}
        });
        const productNodes = products.filter(p => HIDE_UNCONNECTED_RESOURCES ? productEdgesSeen.has(p.ID) : true).map(prod => {
            return {id: "PR_" + prod.ID, title: prod.Name, group: "products"}
        });
        const supplierNodes = suppliers.filter(s => HIDE_UNCONNECTED_RESOURCES ? supplierEdgesSeen.has(s.ID): true).map(sup => {
            return {id: "S_" + sup.ID, title: sup.Name, group: "suppliers", depth:4}
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
            projects: {color: "blue",
                         hover: {
                borderColor: '#ffffff',
                borderWidth: 3,
                background: '#D2E5FF'
              }, widthConstraint: {
                maximum: 40
            }},
            products: {color: "green", widthConstraint: {
                maximum: 60
            }},
            suppliers: {color: "orange", widthConstraint: {
                maximum: 60
            }}
        },
        nodes: {
            shape: "dot",
            // size: 20,
            // borderWidth: 3
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
            arrows: "from"
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
