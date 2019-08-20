import React, { Component } from "react";

import { withStyles } from "@material-ui/core/styles";

import Card from "@material-ui/core/Card";

import TreemapChart from "../treemap-chart/TreemapChart";

import { connect } from "react-redux";

const mapState = state => ({
  currentType: state.currentType
});

const styles = theme => ({
  card: {
    display: "inline-flex",
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: "column",
    width: 344,
    height: 194,
    margin: 12,
    backgroundColor: "#dcdcdc"
  },
  media: {}
});

class TreemapCard extends Component {
  render() {
    const { classes } = this.props;

    const type = this.props.currentType;

    return (
      <Card className={classes.card}>
        <TreemapChart resourceType={type} labels={false} />
      </Card>
    );
  }
}

export default withStyles(styles)(connect(mapState)(TreemapCard));
