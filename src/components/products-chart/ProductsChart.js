import React, { Component } from "react";
import { Typography, Tooltip } from "@material-ui/core";

import { connect } from "react-redux";

import { withStyles } from "@material-ui/core/styles";

import { MAX_IMPACT_SCORE } from "../../utils/risk-calculations";

import { ResourcesDesignators } from "../../utils/general-utils";

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
  scores: state.scores,
  preferences: state.preferences
});

class ProductsChart extends Component {
  getCellColor = (row, col, buckets, numProducts) => {
    const count = buckets[row][col];
    const alpha =
      numProducts > 0 && count > 0 ? (0.9 * count) / numProducts + 0.05 : 0;
    return `rgba(18, 101, 156, ${alpha})`;
  };

  getCellTooltip = (row, col, buckets) => {
    const count = buckets[row][col];
    const label = count == 1 ? this.label : this.labelPlural;
    return `${count} ${label}`;
  };

  render = () => {
    const buckets = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

    const products = Object.values(this.props.products);
    const productScores = this.props.scores.product || {};

    const resourceDesignators = new ResourcesDesignators(
      this.props.preferences
    );
    this.label = resourceDesignators.get("Product");
    this.labelPlural = resourceDesignators.getPlural("Product");

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
              left: 30,
              bottom: 96,
              fontSize: 11,
              fontFamily: "Arial"
            }}
          >
            Interdependence
          </Typography>
          <Typography
            style={{
              position: "absolute",
              transform: "rotate(-90deg)",
              left: 81,
              top: 21,
              fontSize: 11,
              fontFamily: "Arial"
            }}
          >
            high
          </Typography>
          <Typography
            style={{
              position: "absolute",
              transform: "rotate(-90deg)",
              left: 81,
              bottom: 34,
              fontSize: 11,
              fontFamily: "Arial"
            }}
          >
            low
          </Typography>
          <Typography
            style={{
              position: "absolute",
              left: 154,
              bottom: 4,
              fontSize: 11,
              fontFamily: "Arial"
            }}
          >
            Impact
          </Typography>
          <Typography
            style={{
              position: "absolute",
              left: 100,
              fontSize: 11,
              fontFamily: "Arial"
            }}
          >
            low
          </Typography>
          <Typography
            style={{
              position: "absolute",
              right: 100,
              fontSize: 11,
              fontFamily: "Arial"
            }}
          >
            high
          </Typography>
        </div>
      </div>
    );
  };
}

export default withStyles(styles)(connect(mapState)(ProductsChart));
