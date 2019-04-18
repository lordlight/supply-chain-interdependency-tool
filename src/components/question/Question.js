import React, { Component } from 'react';
import { connect } from "react-redux";

import store from '../../redux/store';
import { answerQuestion } from "../../redux/actions";

import { withStyles } from '@material-ui/core/styles';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';

const styles = theme => ({
    root: {
      display: 'flex',
    },
    formControl: {
      margin: theme.spacing.unit * 3,
    },
    group: {
      margin: `${theme.spacing.unit}px 0`,
    },
  });

const mapState = state => ({
    currentType: state.currentType,
    currentItemId: state.currentItemId
});

class Question extends Component {
    handleChange = event => {
        store.dispatch(
            answerQuestion({
                type: this.props.currentType,
                itemId: this.props.currentItemId,
                queId: this.props.question.ID,
                ansInd: event.target.value
            })
        );
    };

    render() {
        if (this.props.question == null){
            return <div className={"question"}>No question was passed to the component.</div>
        }

        let response = "-1";
        if (this.props.response){
            response = this.props.response;
        }
        return (
            <div className={"question"}>
                <FormControl component="fieldset" className="question-form">
                    <FormLabel component="legend">Question {this.props.question.ID}: {this.props.question.Question}</FormLabel>
                    <RadioGroup
                      onChange={(e) => this.handleChange(e, this.props.question.ID)}
                      defaultValue={response}
                    >
                        {this.props.question.Answers.map((answer, i) => (
                            <FormControlLabel key={i} value={i.toString()} control={<Radio/>} label={answer.label} />
                        ))}
                    </RadioGroup>
                </FormControl>
            </div>
        );
    }
}

export default withStyles(styles)(connect(mapState)(Question));