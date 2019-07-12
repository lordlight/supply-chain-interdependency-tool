import React, { Component } from "react";
import { ResponsiveTreeMap } from "@nivo/treemap";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

// import store from '../../redux/store';
import { connect } from "react-redux";

const IMPACT_COLORS = [
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
  supplierQuestions: state.supplierQuestions
});

const theme = {
  fontSize: 11
};

const RESOURCE_NAMES = {
  project: "Projects",
  product: "Products",
  supplier: "Suppliers"
};

class TreemapVisualization extends Component {
  state = {
    resource: "project"
  };

  getImpactColor = impactPct => {
    const colorIdx = Math.min(
      Math.floor((1 - impactPct) * IMPACT_COLORS.length),
      IMPACT_COLORS.length - 1
    );
    const impactColor = IMPACT_COLORS[colorIdx];
    return impactColor;
  };

  constructTree = props => {
    const { products, suppliers, projects, scores } = props;
    let resources;
    if (this.state.resource === "product") {
      resources = products;
    } else if (this.state.resource === "project") {
      resources = projects.filter(pr => !!pr.parent);
    } else if (this.state.resource === "supplier") {
      resources = suppliers;
    }
    const children = Object.values(resources || {}).map(pr => {
      return {
        id: pr.ID,
        name: pr.Name,
        impact: Math.round(
          ((scores[this.state.resource] || {})[pr.ID] || {}).impact || 0
        ),
        exposure: Math.round(
          ((scores[this.state.resource] || {})[pr.ID] || {}).exposure || 0
        )
      };
    });
    const root = {
      id: this.state.resource,
      name: RESOURCE_NAMES[this.state.resource],
      // impact: 0.5,
      // impact: 0,
      children
    };

    return root;
  };

  handleResourceChange = event =>
    this.setState({
      resource: event.target.value
    });

  render() {
    const { classes } = this.props;

    const root = this.constructTree(this.props);
    const maxImpact = Math.max(
      ...Object.values(this.props.scores[this.state.resource] || {}).map(
        entry => entry.impact || 0
      )
    );

    return (
      <React.Fragment>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <FormControl style={{ minWidth: 240, margin: 12 }}>
            <InputLabel htmlFor="resource">Resource Type</InputLabel>
            <Select
              value={this.state.resource}
              onChange={this.handleResourceChange}
              inputProps={{
                name: "resource",
                id: "resource"
              }}
            >
              <MenuItem value="project">Projects</MenuItem>
              <MenuItem value="product">Products</MenuItem>
              <MenuItem value="supplier">Suppliers</MenuItem>
            </Select>
          </FormControl>
        </div>
        <div
          id="risk-graph"
          style={{
            width: "calc(100% - 48px)",
            height: "calc(100% - 288px)",
            position: "fixed"
          }}
          ref={tc => (this.treeContainer = tc)}
        >
          <ResponsiveTreeMap
            root={root}
            identity="id"
            value="exposure"
            innerPadding={3}
            outerPadding={3}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            label="name"
            // labelFormat=".0s"
            labelSkipSize={12}
            // colors={{ datum: IMPACT_COLORS }}
            colors={d =>
              d.impact != null
                ? this.getImpactColor(Math.min(d.impact / maxImpact, 1))
                : "white"
            }
            borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
            // labelTextColor={{ from: "color", modifiers: [["darker", 2.0]] }}
            labelTextColor="black"
            animate={true}
            motionStiffness={90}
            motionDamping={11}
            // tooltip={({ id, value, color, label }) => {
            //   return (
            //     <strong>
            //       {label || id}: {value}
            //     </strong>
            //   );
            // }}
            tooltip={d => {
              return (
                <React.Fragment>
                  <strong>{d.data.name || d.data.id}</strong>
                  {d.data.exposure && d.data.impact && (
                    <React.Fragment>
                      <div>Exposure: {d.data.exposure}</div>
                      <div>Impact: {d.data.impact}</div>
                    </React.Fragment>
                  )}
                </React.Fragment>
              );
            }}
            theme={theme}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default connect(mapState)(TreemapVisualization);
