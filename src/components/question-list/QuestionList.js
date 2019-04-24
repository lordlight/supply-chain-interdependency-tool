import React, { Component } from 'react';

import store from '../../redux/store';
import { connect } from "react-redux";

import { updateCurrentItem} from "../../redux/actions";

import { Question } from "../../components/";

import Link from '@material-ui/core/Link';
import Snackbar from '@material-ui/core/Snackbar';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

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
            <div className="question-list">
                <Table className={this.props.table}>
                    <colgroup>
                        <col style={{width:'480px'}}/>
                    </colgroup>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                {item.Name} questions
                            </TableCell>
                            <TableCell>
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

export default connect(mapState)(QuestionList);