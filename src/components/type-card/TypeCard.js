import React, { Component } from "react";
import { ImportDialog } from "../../components/";

import SuppliersChart from "../suppliers-chart/SuppliersChart";
import ProductsChart from "../products-chart/ProductsChart";
import ProjectsChart from "../projects-chart/ProjectsChart";

import { withStyles } from "@material-ui/core/styles";

import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Typography from "@material-ui/core/Typography";

import store from "../../redux/store";
import { connect } from "react-redux";
import {
  updateCurrentType,
  updateImportFile,
  updateImportState,
  updateNavState
} from "../../redux/actions";

// Images
import placeholder from "../../imgs/placeholder.png";
import suppliersImg from "../../imgs/suppliers.png";
import productsImg from "../../imgs/products.png";
import projectsImg from "../../imgs/projects.png";

const mapState = state => ({
  importState: state.importState
});

const styles = theme => ({
  card: {
    display: "inline-flex",
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: "column",
    width: 344,
    margin: 12
  },
  desc: {
    fontSize: "15px",
    height: "48px",
    overflow: "hidden",
    lineHeight: "1",
    textOverflow: "ellipsis"
  },
  media: {
    height: 194,
    width: 344
  },
  paper: {
    position: "absolute",
    width: theme.spacing.unit * 50,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
    outline: "none"
  },
  title: {
    fontSize: 13,
    fontWeight: "regular",
    textTransform: "uppercase"
  },
  heading: {
    fontSize: 25,
    textTransform: "capitalize"
  }
});

class TypeCard extends Component {
  state = {
    open: false
  };

  handleOpen = () => {
    this.setState({ open: true });
    store.dispatch(updateImportState({ importState: "prompting" }));
  };

  handleClose = event => {
    this.setState({ open: false });
    store.dispatch(updateImportFile({ importFile: null }));
    store.dispatch(updateImportState({ importState: null }));
  };

  handleTypeSelection = (event, type) => {
    store.dispatch(updateCurrentType({ currentType: type }));
    store.dispatch(updateNavState({ navState: type }));
  };

  render() {
    const { classes } = this.props;

    let tempImg = placeholder;
    if (this.props.type === "suppliers") {
      tempImg = suppliersImg;
    } else if (this.props.type === "products") {
      tempImg = productsImg;
    } else if (this.props.type === "projects") {
      tempImg = projectsImg;
    }

    if (this.props.importState === null) {
      this.state.open = false;
      store.dispatch(updateImportFile({ importFile: null }));
    }

    return (
      <div>
        <Card className={classes.card}>
          {this.props.type === "suppliers" && <SuppliersChart />}
          {this.props.type === "products" && <ProductsChart />}
          {this.props.type === "projects" && <ProjectsChart />}
          <CardContent>
            <Typography gutterBottom className={classes.title}>
              {this.props.type}
            </Typography>
            <Typography gutterBottom className={classes.heading}>
              {this.props.items.length > 0
                ? this.props.items.length + " " + this.props.type
                : "No " + this.props.type + " provided"}
            </Typography>
            <Typography
              className={classes.desc}
              color="textSecondary"
              component="p"
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              size="small"
              color="primary"
              style={{
                fontSize: "15px",
                textAlign: "left",
                justifyContent: "left"
              }}
              onClick={e => this.handleTypeSelection(e, this.props.type)}
            >
              DETAILS...
            </Button>
            <Button
              size="small"
              color="primary"
              style={{
                fontSize: "15px",
                textAlign: "left",
                justifyContent: "left"
              }}
              onClick={() => this.handleOpen()}
            >
              IMPORT...
            </Button>
          </CardActions>
        </Card>
        <ImportDialog
          type={this.props.type}
          open={this.state.open}
          handleClose={this.handleClose}
        />
      </div>
    );
  }
}

export default withStyles(styles)(connect(mapState)(TypeCard));
