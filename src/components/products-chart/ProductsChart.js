import React, { Component } from "react";
import { Typography, Tooltip } from "@material-ui/core";

import { connect } from "react-redux";

import { withStyles } from "@material-ui/core/styles";

import { MAX_IMPACT_SCORE } from "../../utils/risk-calculations";

const styles = theme => ({
  cell: {
    display: "table-cell",
    width: 48,
    height: 48,
    backgroundColor: "white",
    borderWidth: 1,
    borderStyle: "solid",
    boxSizing: "border-box",
    borderColor: "rgba(0, 0, 0, 0.33)"
  }
});

const mapState = state => ({
  products: state.products,
  productsRisk: state.productsRisk,
  scores: state.scores
});

class ProductsChart extends Component {
  getCellColor = (row, col, buckets, numProducts) => {
    const alpha =
      numProducts > 0 ? (0.9 * buckets[row][col]) / numProducts + 0.05 : 0;
    return `rgba(18, 101, 156, ${alpha})`;
  };

  getCellTooltip = (row, col, buckets) => {
    return `${buckets[row][col]} Products`;
  };

  render = () => {
    const buckets = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

    const products = Object.values(this.props.products);
    const productScores = this.props.scores.product || {};

    let maxInterdependence = Math.max(
      ...(products.map(
        prod => (productScores[prod.ID] || {}).interdependence
      ) || 0)
    );
    products.forEach(prod => {
      const scores = productScores[prod.ID] || {};
      const impact = scores.Impact !== -Infinity ? scores.impact || 0 : 0;
      const interdependence =
        scores.Interdependence !== -Infinity ? scores.interdependence || 0 : 0;
      const col = Math.min(Math.floor((impact / MAX_IMPACT_SCORE) * 3), 2) || 0;
      const row =
        Math.min(
          Math.floor(
            (interdependence /
              (maxInterdependence !== -Infinity ? maxInterdependence : 0)) *
              3.0
          ),
          2
        ) || 0;
      buckets[row][col]++;
    });
    // Object.values(this.props.productsRisk).forEach(risk => {
    //   // const score = Math.max(risk.score || 100, 0);
    //   const score = Math.max(...Object.values(risk.Dependency), 0);
    //   const col = Math.min(Math.floor(score * 0.03), 2);
    //   const interdependence = Math.max(
    //     ...Object.values(risk.Interdependence),
    //     0
    //   );
    //   const row = Math.min(Math.floor(interdependence * 3.0), 2);
    //   buckets[row][col]++;
    // });
    const numProducts = (this.props.products || []).length;

    const { classes } = this.props;

    return (
      <div
        style={{
          backgroundColor: "#dcdcdc",
          height: 194,
          position: "relative"
        }}
      >
        <div
          style={{
            display: "table",
            marginTop: 16,
            marginBottom: 0,
            marginLeft: "auto",
            marginRight: "auto"
          }}
        >
          <div style={{ display: "table-row" }}>
            {[0, 1, 2].map(col => (
              <Tooltip key={col} title={this.getCellTooltip(2, col, buckets)}>
                <div
                  className={classes.cell}
                  style={{
                    backgroundColor: this.getCellColor(
                      2,
                      col,
                      buckets,
                      numProducts
                    )
                  }}
                />
              </Tooltip>
            ))}
          </div>
          <div style={{ display: "table-row" }}>
            {[0, 1, 2].map(col => (
              <Tooltip key={col} title={this.getCellTooltip(1, col, buckets)}>
                <div
                  className={classes.cell}
                  style={{
                    backgroundColor: this.getCellColor(
                      1,
                      col,
                      buckets,
                      numProducts
                    )
                  }}
                />
              </Tooltip>
            ))}
          </div>
          <div style={{ display: "table-row" }}>
            {[0, 1, 2].map(col => (
              <Tooltip key={col} title={this.getCellTooltip(0, col, buckets)}>
                <div
                  className={classes.cell}
                  style={{
                    backgroundColor: this.getCellColor(
                      0,
                      col,
                      buckets,
                      numProducts
                    )
                  }}
                />
              </Tooltip>
            ))}
          </div>
          <Typography
            style={{
              position: "absolute",
              transform: "rotate(-90deg)",
              left: 14,
              bottom: 96
            }}
          >
            INTERDEPENDENCE
          </Typography>
          <Typography
            style={{
              position: "absolute",
              transform: "rotate(-90deg)",
              left: 74,
              top: 21
            }}
          >
            High
          </Typography>
          <Typography
            style={{
              position: "absolute",
              transform: "rotate(-90deg)",
              left: 74,
              bottom: 39
            }}
          >
            Low
          </Typography>
          <Typography
            style={{
              position: "absolute",
              left: 150,
              bottom: 4
            }}
          >
            IMPACT
          </Typography>
          <Typography
            style={{
              position: "absolute",
              left: 100
            }}
          >
            Low
          </Typography>
          <Typography
            style={{
              position: "absolute",
              right: 100
            }}
          >
            High
          </Typography>
        </div>
      </div>
    );
  };
}

export default withStyles(styles)(connect(mapState)(ProductsChart));
