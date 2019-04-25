import React, { Component } from 'react';

import store from '../../redux/store';
import { connect } from "react-redux";

import { updateCurrentItem} from "../../redux/actions";

import { Question } from "../../components/";

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import Snackbar from '@material-ui/core/Snackbar';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
    questionList: {
        padding: '0px 8px 40px 12px',
    },
    buttonContainer: {
        marginLeft: '24px',
        marginTop: '36px',
    },
    button: {
        color: 'primary',
        width: 181,
        height: 45,
    },
    tertiaryButton: {
        width: 181,
        height: 45,
        marginRight: '12px',
        boxShadow: 'none',
        textTransform: 'none',
        padding: '6px 12px',
        border: '1px solid',
        lineHeight: 1.5,
        color: 'white',
        backgroundColor: '#f5c636',
        borderColor: '#f5c636',
        '&:hover': {
            backgroundColor: '#be9600',
            borderColor: '#be9600',
        },
        '&:active': {
            boxShadow: 'none',
            backgroundColor: '#be9600',
            borderColor: '#be9600',
        },
        '&:focus': {
            boxShadow: '0 0 0 0.2rem rgba(0,123,255,.5)',
        },
    },
});

const mapState = state => ({
    currentType: state.currentType,
    currentItem: state.currentItem,
    supplierQuestions: state.supplierQuestions,
    productQuestions: state.productQuestions,
    projectQuestions: state.projectQuestions,
    suppliersRisk: state.suppliersRisk,
    productsRisk: state.productsRisk,
    projectsRisk: state.projectsRisk,
    supplierResponses: state.supplierResponses, // Responses are objects, with supplier/product/project ids as keys.
    productResponses: state.productResponses,
    projectResponses: state.projectResponses
});

class QuestionList extends Component {
    handleBack = (event) => {
        store.dispatch(updateCurrentItem({currentItem: null}));
    }

    render() {
        const { classes } = this.props;
        if (this.props.currentType == null || this.props.currentItem == null){
            return <div className={"question-list"}>Either the current list type (suppliers, products, projects) or the current id (supplier, product, project) have no value.</div>
        }

        let type = this.props.currentType;
        let item = this.props.currentItem;

        // Get responses for the given 
        let responses = null;
        if (type === "suppliers"){
            responses = this.props.supplierResponses;
        } else if (type === "products"){
            responses = this.props.productResponses;
        } else if (type === "projects"){
            responses = this.props.projectResponses;
        }

        // Filter by the given item (supplier/product/project) id
        if (responses.hasOwnProperty(item.ID)){
            responses = responses[item.ID];
        }

        // Get the relevant questions and assign the relevant risk item
        let questions = null, riskVal = null;
        if (type === "suppliers"){
            questions = this.props.supplierQuestions;
            riskVal = this.props.suppliersRisk[item.ID];
        } else if (type === "products"){
            questions = this.props.productQuestions;
            riskVal = this.props.productsRisk[item.ID];
        } else if (type === "projects"){
            questions = this.props.projectQuestions;
            riskVal = this.props.projectsRisk[item.ID];
        }

        if (questions < 1){
            return (
                <Typography>
                    <p>Questions are not available for {type} at the moment.</p>
                    <Link onClick={(e) => this.handleBack(e)} >
                        Back to {type}
                    </Link>
                </Typography>
            );
        }

        const rows = questions.map((question, i) => (
            <Question key={i} question={question} response={responses[question.ID]}/>
        ));

        return (
            <div className={classes.questionList}>
                <Table className={this.props.table} border={0}>
                    <TableHead>
                        <TableRow style={{border: "none"}}>
                            <TableCell style={{border: "none"}}>
                                {item.Name} questions
                            </TableCell>
                            <TableCell style={{border: "none"}}>
                                <Link
                                  style={{cursor: "pointer"}}
                                  onClick={(e) => this.handleBack(e)}
                                >
                                    Back to {type} overview
                                </Link>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows}
                    </TableBody>
                </Table>
                <div className={classes.buttonContainer}>
                    <Button variant="contained" className={classes.tertiaryButton}>
                        CANCEL
                    </Button>
                    <Button variant="contained" color="primary" className={classes.button}>
                        OK
                    </Button>
                </div>
                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    open={true}
                    ContentProps={{
                        'aria-describedby': 'message-id',
                    }}
                    message={<span id="message-id">Current Risk: {riskVal}</span>}
                />
            </div>
        );
    }
}

export default withStyles(styles)(connect(mapState)(QuestionList));