import React, { Component } from 'react';
import { connect } from "react-redux";

import { withStyles } from '@material-ui/core/styles';

import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';

// Images
import placeholder from "../../imgs/placeholder.png";

const styles = theme => ({
    card: {
        display:"flex",
        width: 344,
        margin: 12,
    },
  });

const mapState = state => ({
    currentType: state.currentType,
    currentItemId: state.currentItemId
});

class TypeCard extends Component {
    render() {
        return (
            <Card className="item-card">
                <CardActionArea>
                    <CardMedia
                        component="img"
                        alt="Projects"
                        className={classes.media}
                        height="194"
                        image={placeholder}
                        title="Projects"
                    />
                    <CardContent>
                    <Typography gutterBottom fontSize={13} fontWeight="regular">
                        PRODUCTS
                    </Typography>
                    <Typography gutterBottom fontSize={21} color="textPrimary" fontWeight="bold">
                        {this.props.projects.length > 0
                            ? this.props.projects.length + "Projects"
                            : "No Projects Provided"
                        }
                    </Typography>
                    <Typography className="card-desc" color="textSecondary" component="p">
                        Lizards are a widespread group of squamate reptiles, with over 6,000 species, ranging
                        across all continents except Antarctica
                    </Typography>
                    <Typography style={{fontSize: "15px"}}>
                        <Link style={{marginRight: "24px"}} onClick={(e) => this.handleTypeSelection(e, "projects")}>
                            DETAILS
                        </Link>
                        <Link onClick={(e) => this.handleTypeSelection(e, "projects")}>
                            IMPORT
                        </Link>
                    </Typography>
                    </CardContent>
                </CardActionArea>
            </Card>
        );
    }
}

export default withStyles(styles)(connect(mapState)(TypeCard));