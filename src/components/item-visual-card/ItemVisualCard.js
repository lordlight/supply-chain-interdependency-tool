import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';

import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';

import { connect } from "react-redux";

// Images
import placeholder from "../../imgs/placeholder.png";

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

        /*if (type === "suppliers"){
            
        } else if (type === "products"){
            
        } else if (type === "projects"){
            
        }*/

        return (
            <Card className={classes.card}>
                <CardMedia
                        component="img"
                        alt="Projects"
                        className={classes.media}
                        height="194"
                        image={placeholder}
                        title={type}
                    />
            </Card>
        );
    }
}

export default withStyles(styles)(connect(mapState)(ItemVisualCard));