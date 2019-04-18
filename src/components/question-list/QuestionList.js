import React, { Component } from 'react';
import { connect } from "react-redux";

import { Question } from "../../components/";

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

const mapState = state => ({
    currentType: state.currentType,
    currentItemId: state.currentItemId,
    supplierQuestions: state.supplierQuestions,
    productQuestions: state.productQuestions,
    projectQuestions: state.projectQuestions,
    supplierResponses: state.supplierResponses, // Responses are objects, with supplier/product/project ids as keys.
    productResponses: state.productResponses,
    projectResponses: state.projectResponses
});

class QuestionList extends Component {
    render() {
        if (this.props.currentType == null || this.props.currentItemId == null){
            return <div className={"question-list"}>Either the current list type (suppliers, products, projects) or the current id (supplier, product, project) have no value.</div>
        }

        let type = this.props.currentType;
        let itemId = this.props.currentItemId;

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
        if (responses.hasOwnProperty(itemId)){
            responses = responses[itemId];
        }

        // Get the relevant questions.
        let questions = null;
        if (type === "suppliers"){
            questions = this.props.supplierQuestions;
        } else if (type === "products"){
            questions = this.props.productQuestions;
        } else if (type === "projects"){
            questions = this.props.projectQuestions;
        }

        if (questions < 1){
            return (
                <Typography>
                    Questions are not available for {type} at the moment.
                </Typography>
            );
        }

        const rows = questions.map((question, i) => (
            <TableRow key={i}>
                <TableCell key={i}>
                    <Question key={i} question={question} response={responses[question.ID]}/>
                </TableCell>
            </TableRow>
        ));

        return (
            <Table className={this.props.table}>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            {itemId} Questions
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows}
                </TableBody>
            </Table>
        );
    }
}

export default connect(mapState)(QuestionList);