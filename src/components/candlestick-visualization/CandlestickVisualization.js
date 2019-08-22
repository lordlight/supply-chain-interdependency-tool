import React, { Component } from "react";
import Plot from "react-plotly.js";
import { SizeMe } from "react-sizeme";

import { MAX_IMPACT_SCORE } from "../../utils/risk-calculations";

import { connect } from "react-redux";

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

class CandlestickVisualization extends Component {
  createData = () => {
    return (this.props.suppliers || [])
      .map(sup => {
        const supplierId = sup.ID;
        const scores = (this.props.scores.supplier || {})[supplierId] || {};
        const supplyLines = scores.supplyLines || [];
        const impacts = Object.values(
          supplyLines.reduce((acc, sl) => {
            acc[sl.productId] = Math.max(acc[sl.productId] || 0, sl.score);
            return acc;
          }, {})
        ).sort();
        return {
          y: impacts,
          type: "box",
          name: sup.Name || "<Unknown>",
          boxpoints: "Outliers",
          jitter: 0.2,

          marker: {
            color: "rgb(18, 101, 156)"
          }
        };
      })
      .sort((a, b) => Math.max(...b.y) - Math.max(...a.y));
  };

  render() {
    const data = this.createData();
    console.log(data);

    return (
      <SizeMe monitorHeight monitorWidth>
        {({ size }) => (
          <div
            style={{
              position: "fixed",
              marginTop: 24,
              width: "calc(100% - 48px)",
              height: "calc(100% - 232px)"
            }}
          >
            <Plot
              data={data}
              layout={{
                // autosize: true,
                // width: "100%",
                // height: "100%",
                width: size.width,
                height: size.height,
                title: "Supplier Impact",
                margin: {
                  // t: 10,
                  // l: 10,
                  // r: 10,
                  b: 200
                },
                showlegend: false,
                marker: {
                  size: 24,
                  width: 24,
                  color: "red"
                },
                xaxis: {
                  showgrid: true,
                  zeroline: false,
                  tickangle: 60,
                  showticklabels: true,
                  type: "category",
                  tickfont: {
                    size: 8
                  }
                },
                yaxis: {
                  title: "Impact",
                  range: [0, MAX_IMPACT_SCORE]
                }
              }}
              config={{ displayModeBar: false }}
            />
          </div>
        )}
      </SizeMe>
    );
  }
}

export default connect(mapState)(CandlestickVisualization);
