import React, { Component } from 'react';
import { connect } from "react-redux";

import store from '../../redux/store';

import { withStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

import { getQuestionResponse } from '../../utils/question-responses';

const styles = theme => ({
    input: {
        borderRadius: 4,
        position: 'relative',
        border: '1px solid rgba(0, 0, 0, 0.54)',
        color: 'rgba(0, 0, 0, 0.54)',
        margin: '',
        fontSize: 17,
        width: '344px',
        height: '45px',
        padding: '0px 8px 0px 12px',
        margin: '24px 0px 24px 40px',
    },
});

const mapState = state => ({
    currentType: state.currentType,
    currentItem: state.currentItem
});

class Question extends Component {
    handleChange = event => {
        this.props.updateResponse(this.props.questionId, event.target.value-1)
        /*store.dispatch(
            answerQuestion({
                type: this.props.currentType,
                itemId: this.props.currentItem.ID,
                queId: this.props.questionId,
                ansInd: event.target.value-1 
            })
        );*/
    };

    render() {
        const { classes } = this.props;
        if (this.props.question == null){
            return <div className={"question"}>No question was passed to the component.</div>
        }

        let response = 0;
        if (this.props.hasOwnProperty("response")){
            if (typeof(this.props.response) !== 'undefined'){
                const val = getQuestionResponse(this.props.response);
                response = parseInt(val);
                // Have to add then remove 1 from the index because the Select only accepts > 0 values (otherwise sets to blank)
                response += 1;
            }
        }
        return (
            <TableRow style={{border: "none"}}>
                <TableCell style={{border: "none"}}>
                    <FormLabel component="legend">{this.props.questionText}</FormLabel>
                    <FormControl component="fieldset" className="question-form">
                        <Select
                            className={classes.input}
                            value={parseInt(response)}
                            onChange={this.handleChange}
                            inputProps={{
                                name: this.props.questionId,
                                id: this.props.questionId,
                            }}
                        >
                            <MenuItem value={0}>
                                (not answered yet)
                            </MenuItem>
                            {this.props.question.Answers.map((answer, i) => (
                                <MenuItem key={i} value={i+1}>{answer.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </TableCell>
            </TableRow>
        );
    }
}

export default withStyles(styles)(connect(mapState)(Question));