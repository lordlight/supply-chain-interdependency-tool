import React, { Component } from 'react';
import { connect } from "react-redux";

import { withStyles } from '@material-ui/core/styles';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormHelperText from '@material-ui/core/FormHelperText';
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

class Question extends Component {
    constructor(props){
        super(props);
    }

    handleChange = event => {
        console.log("value changed: ", event.target.value);
    };

    render() {
        if (this.props.question == null){
            return <div className={"question"}>No question was passed to the component.</div>
        }
        return (
            <div className={"question"}>
                <FormControl component="fieldset" className="question-form">
                    <FormLabel component="legend">Question {this.props.question.QID}: {this.props.question.Question}</FormLabel>
                    <RadioGroup
                      onChange={this.handleChange}
                    >
                        {this.props.question.Answers.map((answer, i) => (
                            <FormControlLabel value={answer.val} control={<Radio/>} label={answer.label} />
                        ))}
                    </RadioGroup>
                </FormControl>
            </div>
        );
    }
}

export default withStyles(styles)(Question);