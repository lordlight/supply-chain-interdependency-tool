import React, { Component } from "react";
import { connect } from "react-redux";

import { withStyles } from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import Popover from "@material-ui/core/Popover";

import BookmarkIcon from "@material-ui/icons/Bookmark";
import InfoIcon from "@material-ui/icons/Info";

import { getQuestionResponse } from "../../utils/general-utils";

const styles = theme => ({
  input: {
    borderRadius: 4,
    position: "relative",
    border: "1px solid rgba(0, 0, 0, 0.54)",
    color: "rgba(0, 0, 0, 0.54)",
    margin: "",
    fontSize: 17,
    width: "344px",
    height: "45px",
    padding: "0px 8px 0px 12px",
    margin: "24px 0px 24px 40px"
  }
});

const mapState = state => ({
  currentType: state.currentType,
  currentItem: state.currentItem
});

class Question extends Component {
  state = {
    anchorEl: null
  };

  handleChange = event => {
    this.props.updateResponse(this.props.questionId, event.target.value - 1);
    /*store.dispatch(
            answerQuestion({
                type: this.props.currentType,
                itemId: this.props.currentItem.ID,
                queId: this.props.questionId,
                ansInd: event.target.value-1 
            })
        );*/
  };

  handleInfoClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleInfoClose = event => {
    this.setState({ anchorEl: null });
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

    const open = Boolean(this.state.anchorEl);

    return (
      <TableRow style={{ border: "none" }}>
        <TableCell
          style={{
            border: "none"
          }}
        >
          <FormLabel component="legend">
            <div style={{ display: "flex", alignItems: "center" }}>
              {response === 0 && (
                // <span
                //   style={{
                //     verticalAlign: "middle"
                //     // color: "primary"
                //   }}
                // >
                // <Typography
                //   color="primary"
                //   style={{
                //     float: "left",
                //     verticalAlign: "middle",
                //     marginRight: 6
                //   }}
                // >
                <BookmarkIcon color="primary" />
                // </Typography>
                // </span>
              )}

              {/* <span
              style={{
                fontWeight: "bolder",
                fontSize: "larger",
                verticalAlign: "middle",
                color: "blue"
              }}
            >
              {response === 0 ? "! " : ""}
            </span> */}
              <span style={{ verticalAlign: "middle", lineHeight: "normal" }}>
                {this.props.questionText}
              </span>
              {this.props.question.Notes && (
                <React.Fragment>
                  <IconButton
                    disableRipple
                    size="small"
                    onClick={this.handleInfoClick}
                    style={{
                      minWidth: 0,
                      padding: 0,
                      width: 24,
                      height: 24,
                      marginLeft: 12
                    }}
                  >
                    {/* <InfoIcon color="primary" style={{ width: 16, height: 16 }} /> */}
                    <InfoIcon color="primary" style={{ fontSize: 20 }} />

                    {/* <Typography color="primary" style={{ fontSize: 12 }}>
                    <InfoIcon style={{ width: 16, height: 16 }} />
                    <div style={{ float: "right" }}>details</div>
                  </Typography> */}
                  </IconButton>
                  <Popover
                    // id={id}
                    open={open}
                    anchorEl={this.state.anchorEl}
                    onClose={this.handleInfoClose}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "center"
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "center"
                    }}
                  >
                    <Typography className={classes.typography}>
                      {this.props.question.Notes}
                    </Typography>
                  </Popover>
                </React.Fragment>
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
