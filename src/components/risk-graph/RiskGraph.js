import React, { Component } from "react";
import Typography from "@material-ui/core/Typography";
import Graph from "react-graph-vis";
import { ForceGraph2D } from "react-force-graph";

// import store from '../../redux/store';
import { connect } from "react-redux";

import { getCellMultiples } from "../../utils/question-responses";

const HIDE_UNCONNECTED_RESOURCES = false;

const mapState = state => ({
  suppliers: state.suppliers,
  products: state.products,
  projects: state.projects,
  shadowProjects: state.shadowProjects,
  suppliersRisk: state.suppliersRisk,
  productsRisk: state.productsRisk,
  projectsRisk: state.projectsRisk,
  productQuestions: state.productQuestions,
  supplierQuestions: state.supplierQuestions
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
  };

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

  componentWillUnmount() {
    console.log("will unmount");
    window.removeEventListener("resize", this.resize);
    clearTimeout(this.resizeTimeout);
  }

  componentDidUpdate = () => {
    this.constructGraph(this.props);
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
    const shadowProjects = props.shadowProjects.map(p => {
      return {
        ...p,
        parent: organizations[0],
        "Parent ID": (organizations[0] || {}).ID
      };
    });
    // const projects = [...shadowProjects, ...props.projects];

    const projectsMap = {};
    projects.forEach(proj => (projectsMap[proj.ID] = proj));
    shadowProjects.forEach(proj => (projectsMap[proj.ID] = proj));
    const suppliersMap = {};
    suppliers.forEach(sup => (suppliersMap[sup.ID] = sup));

    const supplierSupplyLines = {};
    const productSupplyLines = {};
    const projectSupplyLines = {};
    const productAccessLines = {};
    const supplierAccessLines = {};
    const shadowProjectAccessLines = {};
    let organizationImpactScore = 0;

    suppliers.forEach(sup => {
      supplierSupplyLines[sup.ID] = { supplyLines: [], score: 0 };
      supplierAccessLines[sup.ID] = { accessLines: [], score: 0 };
    });
    products.forEach(prod => {
      productSupplyLines[prod.ID] = { supplyLines: [], score: 0 };
      productAccessLines[prod.ID] = { accessLines: [], score: 0 };
    });
    projects.forEach(proj => {
      projectSupplyLines[proj.ID] = { supplyLines: [], score: 0 };
    });
    shadowProjects.forEach(proj => {
      shadowProjectAccessLines[proj.ID] = { accessLines: [], score: 0 };
    });

    // these are tuples of (Project(s), Product, Supplier)
    const supplyLineImpactScores = props.products
      .map(prod => {
        const projectScore = (props.productsRisk[prod.ID] || {}).score;
        const supplierId = prod["Supplier ID"];
        const supplierScore = (props.suppliersRisk[supplierId] || {}).score;
        const projectAndSupplierScore = projectScore * supplierScore;
        const projectIds = getCellMultiples(prod["Project ID"] || "");
        const supplierLines = projectIds.map(prid => {
          const pkey = `projects|${prid}`;
          const productCriticality = ((props.productsRisk[prod.ID] || {})
            .criticality || {})[pkey];
          let score = projectAndSupplierScore * productCriticality;
          let projectChain = [];
          let childId = prid;
          // follow chain of parent projects, normalizing score to 10
          let projectCriticality = 10;
          while (true) {
            projectChain.push(childId);
            const project = projectsMap[childId] || {};
            const parentId = project["Parent ID"];
            if (!parentId) {
              // TODO: also watch for cycles?
              break;
            }
            const pkey = `projects|${parentId}`;
            projectCriticality *=
              (((props.projectsRisk[childId] || {}).criticality || {})[pkey] ||
                10) / 10;
            childId = parentId;
          }
          score *= projectCriticality;
          score /= 1000;
          // only keep first project
          projectChain = projectChain.slice(0, 1);
          const supplierLine = {
            supplyLine: [supplierId, prod.ID, ...projectChain],
            score
          };
          return supplierLine;
        });
        return supplierLines;
      })
      .flat();
    supplyLineImpactScores.forEach(is => {
      const [supplierId, productId, projectId] = is.supplyLine;
      addSupplyLine(supplierSupplyLines[supplierId], is);
      addSupplyLine(productSupplyLines[productId], is);
      addSupplyLine(projectSupplyLines[projectId], is);
      organizationImpactScore += is.score;
    });

    // const productAccessImpactScores = props.products
    //   .map(prod => {
    //     // part of supply line, but not part of score
    //     const supplierId = prod["Supplier ID"];
    //     const productCriticalities =
    //       (props.productsRisk[prod.ID] || {}).criticality || {};
    //     const accessLines = Object.entries(productCriticalities)
    //       .map(entry => {
    //         const akey = entry[0];
    //         if (akey.startsWith("projects.shadow")) {
    //           const [_, prid] = akey.split("|");
    //           console.log("AKEY", akey, prid);
    //           const accessCriticality = entry[1];
    //           const parentId = (projectsMap[prid] || {})["Parent ID"];
    //           const pkey = `projects|${parentId}`;
    //           const projectCriticality = ((props.projectsRisk[prid] || {})
    //             .criticality || {})[pkey];
    //           const score = accessCriticality * projectCriticality * 10.0;
    //           if (score === 0) {
    //             return null;
    //           }
    //           const supplyLine = {
    //             supplyLine: [supplierId, prod.ID, prid],
    //             score
    //           };
    //           return supplyLine;
    //         } else {
    //           return null;
    //         }
    //       })
    //       .filter(Boolean);
    //     return accessLines;
    //   })
    //   .flat();
    // console.log("PRODUCT ACCESS LINES", productAccessImpactScores);

    props.products.forEach(prod => {
      // part of supply line, but not part of score
      const productCriticalities =
        (props.productsRisk[prod.ID] || {}).criticality || {};
      Object.entries(productCriticalities).forEach(entry => {
        const akey = entry[0];
        if (akey.startsWith("projects.shadow")) {
          const [_, prid] = akey.split("|");
          const accessCriticality = entry[1];
          const parentId = (projectsMap[prid] || {})["Parent ID"];
          const pkey = `projects|${parentId}`;
          const projectCriticality = ((props.projectsRisk[prid] || {})
            .criticality || {})[pkey];
          const score = accessCriticality * projectCriticality * 10.0;
          if (score === 0) {
            return null;
          }
          const supplyLine = {
            supplyLine: [prod.ID, prid],
            score
          };
          productAccessLines[prod.ID].accessLines.push(supplyLine);
          shadowProjectAccessLines[prid].accessLines.push(supplyLine);
          organizationImpactScore += score;
        }
      });
    });

    // const supplierAccessScores = props.suppliers
    //   .map(sup => {
    //     const supplierCriticalities =
    //       (props.suppliersRisk[sup.ID] || {}).criticality || {};
    //     const accessCriticalities = Object.entries(supplierCriticalities)
    //       .map(entry => {
    //         const akey = entry[0];
    //         if (akey.startsWith("projects.shadow")) {
    //           const [_, prid] = akey.split("|");
    //           console.log("AKEY", akey, prid);
    //           const accessCriticality = entry[1];
    //           const parentId = (projectsMap[prid] || {})["Parent ID"];
    //           const pkey = `projects|${parentId}`;
    //           const projectCriticality = ((props.projectsRisk[prid] || {})
    //             .criticality || {})[pkey];
    //           const score = accessCriticality * projectCriticality * 10.0;
    //           if (score === 0) {
    //             return null;
    //           }
    //           return { projectId: prid, score };
    //         } else {
    //           return null;
    //         }
    //       })
    //       .filter(Boolean);
    //     const matchingProducts = props.products.filter(
    //       prod => prod["Supplier ID"] === sup.ID
    //     );
    //     const accessLines = matchingProducts
    //       .map(prod =>
    //         accessCriticalities.map(ac => {
    //           const supplyLine = {
    //             supplyLine: [sup.ID, prod.ID, ac.projectId],
    //             score: ac.score
    //           };
    //           return supplyLine;
    //         })
    //       )
    //       .flat();
    //     return accessLines;
    //   })
    //   .flat();
    // console.log("SUPPLIER ACCESS LINES", supplierAccessScores);

    props.suppliers.forEach(sup => {
      const supplierCriticalities =
        (props.suppliersRisk[sup.ID] || {}).criticality || {};
      Object.entries(supplierCriticalities).forEach(entry => {
        const akey = entry[0];
        if (akey.startsWith("projects.shadow")) {
          const [_, prid] = akey.split("|");
          const accessCriticality = entry[1];
          const parentId = (projectsMap[prid] || {})["Parent ID"];
          const pkey = `projects|${parentId}`;
          const projectCriticality = ((props.projectsRisk[prid] || {})
            .criticality || {})[pkey];
          const score = accessCriticality * projectCriticality * 10.0;
          if (score === 0) {
            return null;
          }
          const supplyLine = {
            supplyLine: [sup.ID, prid],
            score
          };
          supplierAccessLines[sup.ID].accessLines.push(supplyLine);
          shadowProjectAccessLines[prid].accessLines.push(supplyLine);
          organizationImpactScore += score;
        }
      });
    });

    Object.values(productSupplyLines).forEach(entry => {
      entry.supplyLines.forEach(line => {
        entry.score += line.score;
      });
    });
    Object.values(supplierSupplyLines).forEach(entry => {
      entry.supplyLines.forEach(line => {
        entry.score += line.score;
      });
    });
    Object.values(projectSupplyLines).forEach(entry => {
      entry.supplyLines.forEach(line => {
        entry.score += line.score;
      });
    });
    Object.values(productAccessLines).forEach(entry => {
      entry.accessLines.forEach(line => {
        entry.score += line.score;
      });
    });
    Object.values(supplierAccessLines).forEach(entry => {
      entry.accessLines.forEach(line => {
        entry.score += line.score;
      });
    });
    Object.values(shadowProjectAccessLines).forEach(entry => {
      entry.accessLines.forEach(line => {
        entry.score += line.score;
      });
    });
    // console.log("ALL SUPPLY/Access LINES", {
    //   supplierSupplyLines,
    //   productSupplyLines,
    //   projectSupplyLines,
    //   supplierAccessLines,
    //   productAccessLines,
    //   shadowProjectAccessLines
    // });

    const supplierEdgesSeen = new Set();
    const productEdgesSeen = new Set();
    const projectEdgesSeen = new Set();
    const supplierImpactScores = {};

    // only one possible parent
    const projectToProjectEdges = projects.map(proj => {
      const parentId = proj["Parent ID"];
      projectEdgesSeen.add(proj.ID);
      projectEdgesSeen.add(parentId);
      const key = `projects|${parentId}`;
      const criticality =
        ((props.projectsRisk[proj.ID] || {}).criticality || {})[key] || 0;
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
    const shadowProjectToProjectEdges = shadowProjects.map(proj => {
      const parentId = proj["Parent ID"];
      projectEdgesSeen.add(proj.ID);
      projectEdgesSeen.add(parentId);
      const key = `projects|${parentId}`;
      const criticality =
        ((props.projectsRisk[proj.ID] || {}).criticality || {})[key] || 0;
      const title = `<div><p>Access Name:&nbsp${
        proj.Name
      }</p><p>Access Criticality:&nbsp;${criticality.toFixed(1)}</p></div>`;
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
    // take into account multiple project edges per product
    const shadowProjectIds = [
      ...new Set(
        this.props.productQuestions
          .filter(q => !!q["Project ID"])
          .map(q => q["Project ID"].split(";"))
          .flat()
      )
    ];
    const projectToProductEdges = products
      .map(prod => {
        // const projectIds = [
        //   ...(prod["Project ID"] || "").split(";").filter(pid => !!pid),
        //   ...productQuestionProjectIds
        // ];
        const projectIds = (prod["Project ID"] || "")
          .split(";")
          .filter(pid => !!pid);
        const productScore = (props.productsRisk[prod.ID] || {}).score || 0;
        const productEdges = projectIds.map(prid => {
          const key = `projects|${prid}`;
          const productCriticality =
            ((props.productsRisk[prod.ID] || {}).criticality || {})[key] || 0;
          if (productCriticality === 0) {
            return null;
          }
          productEdgesSeen.add(prod.ID);
          projectEdgesSeen.add(prid);
          const risk = productCriticality * productScore;
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
        const shadowProjectEdges = shadowProjectIds.map(prid => {
          const key = `projects.shadow|${prid}`;
          const productCriticality =
            ((props.productsRisk[prod.ID] || {}).criticality || {})[key] || 0;
          if (productCriticality === 0) {
            return null;
          }
          productEdgesSeen.add(prod.ID);
          projectEdgesSeen.add(prid);
          // for shadow projects don't use questionnaire score,
          // normalize independently
          const risk = productCriticality * 100.0;
          // const title = `<div><p>Product Name:&nbsp${
          //   prod.Name
          // }</p><p>Project Name:&nbsp;${
          //   (projectsMap[prid] || {}).Name
          // }</p><p>Product Impact:&nbsp${risk.toFixed(1)}</p></div>`;
          const title = `<div><p>Product Name:&nbsp${
            prod.Name
          }</p><p>Access Name:&nbsp;${
            (projectsMap[prid] || {}).Name
          }</p></div>`;
          return {
            from: "P_" + prid,
            to: "PR_" + prod.ID,
            title
            // value: risk / 2.0
          };
        });
        return [...productEdges, ...shadowProjectEdges].filter(Boolean);
        // return [];
      })
      .flat();
    const supplierQuestionProjectIds = [
      ...new Set(
        this.props.supplierQuestions
          .filter(q => !!q["Project ID"])
          .map(q => q["Project ID"].split(";"))
          .flat()
      )
    ];
    const projectToSupplierEdges = suppliers
      .map(sup => {
        const shadowProjectEdges = supplierQuestionProjectIds.map(prid => {
          const key = `projects.shadow|${prid}`;
          const supplierCriticality =
            ((props.suppliersRisk[sup.ID] || {}).criticality || {})[key] || 0;
          if (supplierCriticality === 0) {
            return null;
          }
          supplierEdgesSeen.add(sup.ID);
          projectEdgesSeen.add(prid);
          // for shadow projects don't use questionnaire score,
          // normalize independently
          const risk = supplierCriticality * 100.0;
          // const title = `<div><p>Supplier Name:&nbsp${
          //   sup.Name
          // }</p><p>Project Name:&nbsp;${
          //   (projectsMap[prid] || {}).Name
          // }</p><p>Supplier Impact:&nbsp${risk.toFixed(1)}</p></div>`;
          const title = `<div><p>Supplier Name:&nbsp${
            sup.Name
          }</p><p>Access Name:&nbsp;${
            (projectsMap[prid] || {}).Name
          }</p></div>`;
          return {
            from: "P_" + prid,
            to: "S_" + sup.ID,
            title
            // value: risk / 2.0
          };
        });

        // const supplierRisk = (props.suppliersRisk[sup.ID] || {}).score || 0;
        // const supplierEdges = supplierQuestionProjectIds.map(prid => {
        //   const project = projectsMap[prid] || {};
        //   const parentId = project["Parent ID"];
        //   const pkey = `projects|${parentId}`;
        //   const projectCriticality =
        //     ((props.projectsRisk[prid] || {}).criticality || {})[pkey] || 10;
        //   const key = `projects|${prid}`;
        //   // const projectCriticality = ((props.projectsRisk[prid] || {}).criticality || {}).default || 0;
        //   const supplierCriticality =
        //     ((props.suppliersRisk[sup.ID] || {}).criticality || {})[key] || 0;
        //   if (supplierCriticality === 0) {
        //     return null;
        //   }
        //   supplierEdgesSeen.add(sup.ID);
        //   projectEdgesSeen.add(prid);
        //   const risk = supplierCriticality * supplierRisk;
        //   const title = `<div><p>Supplier Name:&nbsp${
        //     sup.Name
        //   }</p><p>Project Name:&nbsp;${
        //     (projectsMap[prid] || {}).Name
        //   }</p><p>Supplier Risk:&nbsp${risk.toFixed(1)}</p></div>`;
        //   const totalImpactScore = (risk * projectCriticality) / 10;
        //   supplierImpactScores[sup.ID] =
        //     (supplierImpactScores[sup.ID] || 0) + totalImpactScore;
        //   return {
        //     from: "P_" + prid,
        //     to: "S_" + sup.ID,
        //     title,
        //     value: risk / 2.0
        //     // chosen: {
        //     //   edge: values => {
        //     //     values.color = "#7f0000";
        //     //   }
        //     // }
        //   };
        // });
        return shadowProjectEdges.filter(Boolean);
        // return [];
      })
      .flat();
    const productToSupplierEdges = products.map(prod => {
      productEdgesSeen.add(prod.ID);
      supplierEdgesSeen.add(prod["Supplier ID"]);
      const supId = prod["Supplier ID"];
      const supplierRisk = (props.suppliersRisk[supId] || {}).score || 0;
      const productRisk = (props.productsRisk[prod.ID] || {}).score || 0;
      const projectIds = (prod["Project ID"] || "")
        .split(";")
        .filter(pid => !!pid);
      let totalImpactScore = 0;

      projectIds.forEach(prid => {
        let projectCriticality = 10.0;
        let childId = prid;
        // follow chain of parent projects, normalizing score to 10
        while (true) {
          const project = projectsMap[childId] || {};
          const parentId = project["Parent ID"];
          if (!parentId) {
            // TODO: also watch for cycles?
            break;
          }
          const pkey = `projects|${parentId}`;
          projectCriticality *=
            (((props.projectsRisk[childId] || {}).criticality || {})[pkey] ||
              10) / 10;
          childId = parentId;
        }
        const key = `projects|${prid}`;
        const productCriticality =
          ((props.productsRisk[prod.ID] || {}).criticality || {})[key] || 0;
        totalImpactScore +=
          (projectCriticality *
            productCriticality *
            productRisk *
            supplierRisk) /
          1000;
      });
      supplierImpactScores[supId] =
        (supplierImpactScores[supId] || 0) + totalImpactScore;
      // const title = `<div><p>Supplier Name:&nbsp;${
      //   (suppliersMap[supId] || {}).Name
      // }</p><p>Product Name:&nbsp;${
      //   prod.Name
      // }</p><p>Supply Chain Impact Score:&nbsp;${totalImpactScore.toFixed(
      //   1
      // )}</p></div>`;
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
        const score = projectSupplyLines[proj.ID].score;
        // const criticality =
        //   ((props.projectsRisk[proj.ID] || {}).criticality || {})[pkey] || 0;
        const title = `<div><p>Project Name:&nbsp${
          proj.Name
        }</p><p>Project Impact Score:&nbsp;${score.toFixed(1)}</p></div>`;
        const level = Math.max((proj.Level || "").split(".").length - 1, 1);
        curNodeLevel = Math.max(curNodeLevel, level);
        return {
          id: "P_" + proj.ID,
          title,
          group: "projects",
          value: score * 10.0,
          level: level,
          label: score.toFixed(1)
        };
      });
    const shadowProjectNodes = shadowProjects
      .filter(pr =>
        HIDE_UNCONNECTED_RESOURCES ? projectEdgesSeen.has(pr.ID) : true
      )
      .map(proj => {
        // const parentId = proj["Parent ID"];
        // const pkey = `projects|${parentId}`;
        const score = shadowProjectAccessLines[proj.ID].score;
        const title = `<div><p>Access Name:&nbsp${
          proj.Name
        }</p><p>Access Impact Score:&nbsp;${score.toFixed(1)}</p></div>`;
        const level = Math.max((proj.Level || "").split(".").length - 1, 1);
        curNodeLevel = Math.max(curNodeLevel, level);
        return {
          id: "P_" + proj.ID,
          title,
          group: "shadow",
          value: score * 10.0,
          level: level,
          label: score.toFixed(1)
        };
      });
    curNodeLevel++;
    const productNodes = products
      .filter(p =>
        HIDE_UNCONNECTED_RESOURCES ? productEdgesSeen.has(p.ID) : true
      )
      .map(prod => {
        const qscore = (props.productsRisk[prod.ID] || {}).score || 0;
        const score =
          productSupplyLines[prod.ID].score + productAccessLines[prod.ID].score;
        const title = `<div><p>Product Name:&nbsp${
          prod.Name
        }</p><p>Product Impact Score:&nbsp${score.toFixed(1)}</p></div>`;
        return {
          id: "PR_" + prod.ID,
          title,
          group: "products",
          value: score,
          level: curNodeLevel,
          label: score.toFixed(1)
        };
      });
    curNodeLevel++;
    const supplierNodes = suppliers
      .filter(s =>
        HIDE_UNCONNECTED_RESOURCES ? supplierEdgesSeen.has(s.ID) : true
      )
      .map(sup => {
        // const impact = supplierImpactScores[sup.ID] || 0;
        const score =
          supplierSupplyLines[sup.ID].score + supplierAccessLines[sup.ID].score;
        const title = `<div><p>Supplier Name:&nbsp${
          sup.Name
        }</p><p>Supplier Impact Score:&nbsp${score.toFixed(1)}</p></div>`;
        return {
          id: "S_" + sup.ID,
          label: score.toFixed(1),
          title,
          group: "suppliers",
          value: score,
          level: curNodeLevel
        };
      });
    const organizationNodes = organizations.map(proj => {
      return {
        shape: "circle",
        id: "P_" + proj.ID,
        title: "Organization Name: " + proj.Name,
        label: organizationImpactScore.toFixed(1),
        value: organizationImpactScore * 10,
        level: 0
      };
    });
    const nodes = [
      ...organizationNodes,
      ...shadowProjectNodes,
      ...projectNodes,
      ...productNodes,
      ...supplierNodes
    ];
    const edges = [
      ...projectToProjectEdges,
      ...shadowProjectToProjectEdges,
      ...projectToProductEdges,
      ...projectToSupplierEdges,
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
      projects: { shape: "circle", color: "lightblue" },
      shadow: { shape: "circle", borderWidth: 4, color: { border: "blue" } },
      products: { shape: "circle", color: "lightgreen" },
      suppliers: { shape: "circle", color: "orange" }
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
        levelSeparation: 300,
        nodeSpacing: 200,
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

  render() {
    return (
      <div
        id="risk-graph"
        style={{ width: "100%", height: "100%", position: "fixed" }}
        ref={tc => (this.treeContainer = tc)}
      >
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
      </div>
    );
  }
}

export default connect(mapState)(RiskGraph);
