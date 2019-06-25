import React, { Component } from "react";

import store from "../../redux/store";
import { connect } from "react-redux";
import {
  answerMulti,
  answerTemp,
  updateCurrentItem,
  updateTempResponses
} from "../../redux/actions";

import { Question, SupplierDetails } from "../../components/";

import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Snackbar from "@material-ui/core/Snackbar";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";

import { getQuestionResponse } from "../../utils/question-responses";

const styles = theme => ({
  questionList: {
    padding: "32px 8px 32px 44px"
  },
  buttonContainer: {
    marginLeft: "24px",
    marginTop: "36px"
  },
  button: {
    color: "primary",
    width: 181,
    height: 45
  },
  tertiaryButton: {
    width: 181,
    height: 45,
    marginRight: "12px",
    boxShadow: "none",
    textTransform: "none",
    padding: "6px 12px",
    border: "1px solid",
    lineHeight: 1.5,
    color: "white",
    backgroundColor: "#f5c636",
    borderColor: "#f5c636",
    "&:hover": {
      backgroundColor: "#be9600",
      borderColor: "#be9600"
    },
    "&:active": {
      boxShadow: "none",
      backgroundColor: "#be9600",
      borderColor: "#be9600"
    },
    "&:focus": {
      boxShadow: "0 0 0 0.2rem rgba(0,123,255,.5)"
    }
  },
  sectionTitle: {
    marginTop: 32,
    marginBottom: 32
  }
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
  projectResponses: state.projectResponses,
  tempResponses: state.tempResponses,
  projects: state.projects
});

class QuestionList extends Component {
  updateResponse = (qId, ansInd) => {
    store.dispatch(answerTemp({ qId: qId, ansInd: ansInd }));
  };

  handleCancel = () => {
    store.dispatch(updateTempResponses({ tempResponses: {} }));
    store.dispatch(updateCurrentItem({ currentItem: null }));
  };

  handleSave = () => {
    let responses = null;
    if (this.props.currentType === "suppliers") {
      responses = this.props.supplierResponses;
    } else if (this.props.currentType === "products") {
      responses = this.props.productResponses;
    } else if (this.props.currentType === "projects") {
      responses = this.props.projectResponses;
    }

    if (responses.hasOwnProperty(this.props.currentItem.ID)) {
      responses = responses[this.props.currentItem.ID];
    }

    let allResponses = Object.assign({}, responses);
    console.log("current: ", responses);
    console.log("temp: ", this.props.tempResponses);

    const timestamp = Date.now();
    Object.entries(this.props.tempResponses).forEach(resp => {
      let key = resp[0],
        val = resp[1];
      const oldVal = getQuestionResponse(responses[key]);
      if (val !== oldVal) {
        allResponses[key] = [val, timestamp];
      }
    });

    store.dispatch(
      answerMulti({
        type: this.props.currentType,
        itemId: this.props.currentItem.ID,
        responses: allResponses
      })
    );

    this.handleCancel();
  };

  componentDidMount = () => {
    window.scrollTo(0, 0);
  };

  render() {
    const { classes } = this.props;
    if (this.props.currentType == null || this.props.currentItem == null) {
      return (
        <div className={"question-list"}>
          Either the current list type (suppliers, products, projects) or the
          current id (supplier, product, project) have no value.
        </div>
      );
    }

    let type = this.props.currentType;
    let item = this.props.currentItem;

    // Get responses for the given
    let responses = null;
    if (type === "suppliers") {
      responses = this.props.supplierResponses;
    } else if (type === "products") {
      responses = this.props.productResponses;
    } else if (type === "projects") {
      responses = this.props.projectResponses;
    }

    // Filter by the given item (supplier/product/project) id
    if (responses.hasOwnProperty(item.ID)) {
      responses = responses[item.ID];
    }

    // Get the relevant questions and assign the relevant risk item
    let questions = null; //, riskVal = null;
    if (type === "suppliers") {
      questions = this.props.supplierQuestions;
      //riskVal = this.props.suppliersRisk[item.ID];
    } else if (type === "products") {
      questions = this.props.productQuestions;
      //riskVal = this.props.productsRisk[item.ID];
    } else if (type === "projects") {
      questions = this.props.projectQuestions;
      //riskVal = this.props.projectsRisk[item.ID];
    }

    // Shallow copy, as responses should be only one level deep
    let alteredResponses = Object.assign({}, responses);

    Object.entries(this.props.tempResponses).forEach(resp => {
      let key = resp[0],
        val = resp[1];
      alteredResponses[key] = val;
    });

    if (questions < 1) {
      return (
        <Typography>
          Questions are not available for {type} at the moment.
        </Typography>
      );
    }

    const impactRows = questions
      .filter(q => q["Type of question"] === "impact")
      .map((q, i) => {
        return (
          <Question
            key={i}
            question={q}
            questionId={q.ID}
            questionText={q.Question}
            response={alteredResponses[q.ID]}
            updateResponse={this.updateResponse}
          />
        );
      });
    let criticalityRows = questions
      .filter(q => q["Type of question"] === "criticality")
      .map((q, i) => {
        const relationInfo = q.Relation;
        if (relationInfo) {
          const [relationType, relationKey] = relationInfo.split(";");
          // question may have relation override if question about "shadow" resource
          const relationVal = q[relationKey] || item[relationKey] || "";
          const subkeys = relationVal.split(";").filter(k => !!k);
          const resourcesMap = {};
          this.props[relationType].forEach(r => (resourcesMap[r.ID] = r));
          return subkeys.map(sk => {
            const qid = `${q.ID}|${sk}`;
            const questionText = q.Question.replace(
              `[${relationKey}]`,
              `"${(resourcesMap[sk] || {}).Name || sk}"`
            );
            return (
              <Question
                key={qid}
                question={q}
                questionId={qid}
                questionText={questionText}
                response={alteredResponses[qid]}
                updateResponse={this.updateResponse}
              />
            );
          });
        } else {
          return (
            <Question
              key={q.ID}
              question={q}
              questionId={q.ID}
              questionText={q.Question}
              response={alteredResponses[q.ID]}
              updateResponse={this.updateResponse}
            />
          );
        }
      });
    criticalityRows = [].concat(...criticalityRows);

    return (
      <React.Fragment>
        {type === "suppliers" && (
          <React.Fragment>
            <div className={classes.questionList}>
              <SupplierDetails supplier={item} />
            </div>
            <Divider />
          </React.Fragment>
        )}
        <div className={classes.questionList}>
          {criticalityRows.length > 0 && (
            <React.Fragment>
              {impactRows.length > 0 && (
                <Typography
                  variant="subtitle2"
                  className={classes.sectionTitle}
                >
                  Criticality Questions
                </Typography>
              )}
              <Table className={this.props.table} border={0}>
                {/* <TableHead>
                                <TableRow style={{border: "none"}}>
                                    <TableCell style={{border: "none"}}>
                                    </TableCell>
                                </TableRow>
                            </TableHead> */}
                <TableBody>{criticalityRows}</TableBody>
              </Table>
            </React.Fragment>
          )}
          {impactRows.length > 0 && (
            <React.Fragment>
              {criticalityRows.length > 0 && (
                <Typography
                  variant="subtitle2"
                  className={classes.sectionTitle}
                >
                  Impact Questions
                </Typography>
              )}
              <Table className={this.props.table} border={0}>
                {/* <TableHead>
                                <TableRow style={{border: "none"}}>
                                    <TableCell style={{border: "none"}}>
                                    </TableCell>
                                </TableRow>
                            </TableHead> */}
                <TableBody>{impactRows}</TableBody>
              </Table>
            </React.Fragment>
          )}
          <div className={classes.buttonContainer}>
            <Button
              onClick={this.handleCancel}
              variant="contained"
              className={classes.tertiaryButton}
            >
              CANCEL
            </Button>
            <Button
              onClick={this.handleSave}
              variant="contained"
              color="primary"
              className={classes.button}
            >
              OK
            </Button>
          </div>
          {/*<Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    open={true}
                    ContentProps={{
                        'aria-describedby': 'message-id',
                    }}
                    message={<span id="message-id">Current Risk: {riskVal}</span>}
                />*/}
        </div>
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(connect(mapState)(QuestionList));
