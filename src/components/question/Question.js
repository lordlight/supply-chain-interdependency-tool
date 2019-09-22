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

import {
  getQuestionResponse,
  ResourcesDesignators
} from "../../utils/general-utils";

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
  currentItem: state.currentItem,
  preferences: state.preferences
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

    // ideally this should only be done on startup and when preferences are changed, rather than on each question render
    const resourceDesignators = new ResourcesDesignators(
      this.props.preferences
    );

    // local mapping in order to better handle plurals and special cases
    const designatorVariables = {
      "{Project}": resourceDesignators.get("Project"),
      "{project}": resourceDesignators.get("project"),
      "{Projects}": resourceDesignators.getPlural("Project"),
      "{projects}": resourceDesignators.getPlural("project"),
      "{Product}": resourceDesignators.get("Product"),
      "{product}": resourceDesignators.get("product"),
      "{Products}": resourceDesignators.getPlural("Product"),
      "{products}": resourceDesignators.getPlural("product"),
      "{Supplier}": resourceDesignators.get("Supplier"),
      "{supplier}": resourceDesignators.get("supplier"),
      "{Suppliers}": resourceDesignators.getPlural("Supplier"),
      "{suppliers}": resourceDesignators.getPlural("supplier"),
      // special cases
      "{Product/Service}": (() => {
        const designator = resourceDesignators.get("Product");
        return designator === "Product" ? "Product/Service" : designator;
      })(),
      "{product/service}": (() => {
        const designator = resourceDesignators.get("product");
        return designator === "product" ? "product/service" : designator;
      })(),
      "{Products/Services}": (() => {
        const designator = resourceDesignators.getPlural("Product");
        return designator === "Products" ? "Products/Services" : designator;
      })(),
      "{products/services}": (() => {
        const designator = resourceDesignators.getPlural("product");
        return designator === "products" ? "products/services" : designator;
      })()
    };

    let questionText = this.props.questionText;
    let questionInfoText = this.props.question["Question Info Text"];
    const re = new RegExp(Object.keys(designatorVariables).join("|"), "g");
    questionText = questionText.replace(re, match => {
      console.log("MMMMMM", match);
      return designatorVariables[match];
    });
    questionInfoText = questionInfoText.replace(
      re,
      match => designatorVariables[match]
    );

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
                {questionText}
              </span>
              {questionInfoText && (
                <Tooltip
                  title={questionInfoText}
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
