import React, { Component } from "react";
import { connect } from "react-redux";

import { withStyles } from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";

import BookmarkIcon from "@material-ui/icons/Bookmark";
import InfoIcon from "@material-ui/icons/Info";

import Tooltip from "@material-ui/core/Tooltip";

import { getQuestionResponse } from "../../utils/general-utils";

const styles = theme => ({
  input: {
    borderRadius: 4,
    position: "relative",
    border: "1px solid rgba(0, 0, 0, 0.54)",
    color: "rgba(0, 0, 0, 0.54)",
    fontSize: 17,
    width: "344px",
    height: "45px",
    padding: "0px 8px 0px 12px",
    margin: "24px 0px 24px 40px"
  },
  typography: {
    padding: theme.spacing.unit
  },
  tooltip: {
    backgroundColor: "white",
    color: "black",
    fontSize: 14,
    boxShadow: theme.shadows[1],
    // maxWidth: "none",
    overflow: "visible",
    whiteSpace: "normal",
    wordBreak: "break-word"
  }
});

const mapState = state => ({
  currentType: state.currentType,
  currentItem: state.currentItem
});

class Question extends Component {
  handleChange = event => {
    this.props.updateResponse(this.props.questionId, event.target.value - 1);
  };

  render() {
    const { classes } = this.props;
    if (this.props.question == null) {
      return (
        <div className={"question"}>
          No question was passed to the component.
        </div>
      );
    }

    let response = 0;
    if (this.props.hasOwnProperty("response")) {
      if (typeof this.props.response !== "undefined") {
        const val = getQuestionResponse(this.props.response);
        response = parseInt(val);
        // Have to add then remove 1 from the index because the Select only accepts > 0 values (otherwise sets to blank)
        response += 1;
      }
    }

    return (
      <TableRow style={{ border: "none" }}>
        <TableCell
          style={{
            border: "none"
          }}
        >
          <FormLabel component="legend">
            <div style={{ display: "flex", alignItems: "center" }}>
              <Tooltip
                title="Bookmarked questions are those that have not been answered yet."
                classes={{ tooltip: classes.tooltip }}
              >
                <IconButton
                  disableRipple
                  size="small"
                  style={{
                    minWidth: 0,
                    padding: 0,
                    width: 24,
                    height: 24
                  }}
                >
                  <BookmarkIcon
                    color="primary"
                    style={{
                      visibility: response === 0 ? "visible" : "hidden"
                    }}
                  />
                </IconButton>
              </Tooltip>
              <span style={{ verticalAlign: "middle", lineHeight: "normal" }}>
                {this.props.questionText}
              </span>
              {this.props.question["Question Info Text"] && (
                <Tooltip
                  title={this.props.question["Question Info Text"]}
                  classes={{ tooltip: classes.tooltip }}
                >
                  <IconButton
                    disableRipple
                    size="small"
                    style={{
                      minWidth: 0,
                      padding: 0,
                      width: 24,
                      height: 24,
                      marginLeft: 6
                    }}
                  >
                    <InfoIcon color="primary" style={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}
            </div>
          </FormLabel>
          <FormControl component="fieldset" className="question-form">
            <Select
              className={classes.input}
              value={parseInt(response)}
              onChange={this.handleChange}
              inputProps={{
                name: this.props.questionId,
                id: this.props.questionId
              }}
            >
              {response === 0 && (
                <MenuItem value={0}>(not answered yet)</MenuItem>
              )}
              {this.props.question.Answers.map((answer, i) => (
                <MenuItem key={i} value={i + 1}>
                  {answer.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </TableCell>
      </TableRow>
    );
  }
}

export default withStyles(styles)(connect(mapState)(Question));
