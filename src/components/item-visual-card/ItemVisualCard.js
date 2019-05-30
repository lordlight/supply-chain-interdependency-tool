import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';

import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';

import SuppliersChart from "../suppliers-chart/SuppliersChart";
import ProductsChart from '../products-chart/ProductsChart';

import { connect } from "react-redux";

// Images
// import placeholder from "../../imgs/placeholder.png";
import projectsImg from "../../imgs/projects.png";

const mapState = state => ({
    currentType: state.currentType
});

const styles = theme => ({
    card: {
        display:"inline-flex",
        flexShrink: 0,
        flexGrow: 0,
        flexDirection: 'column',
        width: 344,
        height: 194,
        margin: 12,
    },
    media: {

    },
  });

class ItemVisualCard extends Component {
    render() {
        const { classes } = this.props;

        const type = this.props.currentType;

        return (
            <Card className={classes.card}>
                {type === "suppliers" && <SuppliersChart></SuppliersChart>}
                {type === "products" && <ProductsChart></ProductsChart>}

                {type === "projects" && <CardMedia
                        component="img"
                        alt="Projects"
                        className={classes.media}
                        height="194"
                        image={projectsImg}
                        title={type}
                    />}
            </Card>
        );
    }
}

export default withStyles(styles)(connect(mapState)(ItemVisualCard));