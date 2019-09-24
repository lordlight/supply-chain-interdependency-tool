import React, { Component } from "react";
import Plot from "react-plotly.js";
import { SizeMe } from "react-sizeme";

import { MAX_IMPACT_SCORE } from "../../utils/risk-calculations";

import { ResourcesDesignators } from "../../utils/general-utils";

import store from "../../redux/store";
import {
  updateNavState,
  updateCurrentType,
  setSelectedResource
} from "../../redux/actions";
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
          id: supplierId,
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

  selected = null;
  lastClicked = null;
  lastClickedTimestamp = 0;

  render() {
    const data = this.createData();

    const resourceDesignators = new ResourcesDesignators(
      this.props.preferences
    );

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
                width: size.width,
                height: size.height,
                title: `${resourceDesignators.get(
                  "Product"
                )} Impact by ${resourceDesignators.get("Supplier")}`,
                margin: {
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
                    size: 10
                  }
                },
                yaxis: {
                  title: "Impact",
                  range: [0, MAX_IMPACT_SCORE]
                }
              }}
              config={{ displayModeBar: false }}
              onClick={x => {
                const selected = x.points[0];
                if (selected) {
                  const timestamp = new Date().getTime();
                  if (
                    this.lastClicked === selected.data.id &&
                    timestamp - this.lastClickedTimestamp <= 500
                  ) {
                    store.dispatch(
                      setSelectedResource({
                        resourceType: "suppliers",
                        resourceId: this.lastClicked
                      })
                    );
                    store.dispatch(
                      updateCurrentType({
                        currentType: "suppliers"
                      })
                    );
                    store.dispatch(
                      updateNavState({
                        navState: "suppliers"
                      })
                    );
                    this.lastClicked = null;
                    this.lastClickedTimestamp = 0;
                  } else {
                    this.lastClicked = selected.data.id;
                    this.lastClickedTimestamp = timestamp;
                  }
                }
              }}
            />
          </div>
        )}
      </SizeMe>
    );
  }
}

export default connect(mapState)(CandlestickVisualization);
