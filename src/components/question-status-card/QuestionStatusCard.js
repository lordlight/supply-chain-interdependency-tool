import React, { Component } from 'react';
import { ImportDialog } from '../../components/';

import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

import store from '../../redux/store';
import { connect } from "react-redux";
import { updateCurrentType, updateImportFile, updateImportState, updateNavState } from "../../redux/actions";

// Images
import placeholder from "../../imgs/placeholder.png";
import suppliersImg from "../../imgs/suppliers.png";
import productsImg from "../../imgs/products.png";
import projectsImg from "../../imgs/projects.png";

const mapState = state => ({
    currentType: state.currentType,
    suppliers: state.suppliers,
    products: state.products,
    projects: state.projects,
    supplierQuestions: state.supplierQuestions,
    productQuestions: state.productQuestions,
    projectQuestions: state.projectQuestions,
    supplierResponses: state.supplierResponses,
    productResponses: state.productResponses,
    projectResponses: state.projectResponses
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
    title: {
        fontSize: 13,
        fontWeight: "regular",
        textTransform: "capitalize",
    },
    heading: {
        fontSize: 25,
        textTransform: 'capitalize',
    },
  });

class QuestionStatusCard extends Component {
    render() {
        const { classes } = this.props;

        // Expecting type, items, questions, responses
        const type = this.props.currentType;
        let items, questions, responses;

        if (type === "suppliers"){
            items = [...this.props.suppliers];
            questions = this.props.supplierQuestions;
            responses = this.props.supplierResponses;
        } else if (type === "products"){
            items = [...this.props.products];
            questions = this.props.productQuestions;
            responses = this.props.productResponses;
        } else if (type === "projects"){
            items = [...this.props.projects];
            questions = this.props.projectQuestions;
            responses = this.props.projectResponses;
        }

        let numCompleted = 0, numPartial = 0, numZero = 0;

        items.forEach((item) => {
            let numResp = Object.keys(responses[item.ID]).length;
            if (numResp === questions.length){
                numCompleted += 1;
            } else if (numResp > 0){
                numPartial += 1;
            } else {
                numZero += 1;
            }
        });

        return (
            <Card className={classes.card}>
                <CardContent>
                    <Typography gutterBottom className={classes.title}>
                        {type.substring(0, type.length - 1)} question status
                    </Typography>
                    <Typography gutterBottom className={classes.heading}>
                        {items.length} {type}:
                    </Typography>
                    <Typography className={classes.complete}  component="div">
                        {numCompleted} {type} with complete data
                    </Typography>
                    <Typography className={classes.partial}  component="div">
                        {numPartial} {type} with partial data
                    </Typography>
                    <Typography className={classes.zero}  component="div">
                        {numZero} {type} with no data
                    </Typography>
                </CardContent>
            </Card>
        );
    }
}

export default withStyles(styles)(connect(mapState)(QuestionStatusCard));