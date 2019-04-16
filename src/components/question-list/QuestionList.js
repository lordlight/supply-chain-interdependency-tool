import React, { Component } from 'react';
import { connect } from "react-redux";

import { Question } from "../../components/";

const mapState = state => ({
    supplierQuestions: state.supplierQuestions,
    productQuestions: state.productQuestions,
    projectQuestions: state.projectQuestions
});

class QuestionList extends Component {
    constructor(props){
        super(props);
    }

    render() {
        if (/*this.props.supplierId == null ||*/ this.props.type == null /*|| this.props.responses == null*/){
            return <div className={"question-list"}>Missing component attributes. Make sure to provide supplierId, questions, responses.</div>
        }

        console.log("type: ", this.props.type);

        let questions = null;
        if (this.props.type === "suppliers"){
            questions = this.props.supplierQuestions;
        } else if (this.props.type === "products"){
            questions = this.props.productQuestions;
        } else if (this.props.type === "projects"){
            questions = this.props.projectQuestions;
        }

        console.log("questions  : ", questions);

        if (questions < 1){
            return null;
        }

        return (
            <div className={"question-list"}>
                {questions.map((question, i) => (
                    <Question question={question}/>
                ))}
            </div>
        );
    }
}

export default connect(mapState)(QuestionList);