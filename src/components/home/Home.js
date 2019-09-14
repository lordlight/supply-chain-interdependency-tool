import React, { Component } from "react";

import { TodosCard, TypeCard } from "../../components/";

import { withStyles } from "@material-ui/core/styles";

import store from "../../redux/store";
import {
  updateCurrentItem,
  updateCurrentType,
  updateNavState
} from "../../redux/actions";
import { connect } from "react-redux";

const mapState = state => ({
  suppliers: state.suppliers,
  products: state.products,
  projects: state.projects
});

const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    width: "100%",
    justifyContent: "left",
    alignItems: "flex-start"
  },
  card: {
    display: "inline-flex",
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: "column",
    width: 344,
    margin: 12
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: "center",
    color: theme.palette.text.secondary
  }
});

class Home extends Component {
  constructor(props) {
    super(props);
    // Clear current type on home
    store.dispatch(updateCurrentType({ currentType: null }));
    store.dispatch(updateCurrentItem({ currentItem: null }));
  }

  handleTypeSelection = (event, type) => {
    store.dispatch(updateCurrentType({ currentType: type }));
    store.dispatch(updateNavState({ navState: type }));
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <TypeCard type="suppliers" items={this.props.suppliers} />
        <TypeCard type="products" items={this.props.products} />
        <TypeCard
          type="projects"
          items={this.props.projects.filter(proj => !!proj.parent)}
        />
        <TodosCard />
        {/* <ActionCard type="recommendations" items={testRecs} title="Cyber Supply Chain Risk" plural="Recommendations"/> */}
      </div>
    );
  }
}

export default withStyles(styles)(connect(mapState)(Home));
