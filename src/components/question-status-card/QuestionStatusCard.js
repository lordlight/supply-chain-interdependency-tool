import React, { Component } from "react";

import { ImportDialog } from "../../components/";

import { withStyles } from "@material-ui/core/styles";

import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import IconButton from "@material-ui/core/IconButton";
import GestureIcon from "@material-ui/icons/Gesture";
import Typography from "@material-ui/core/Typography";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";

import Slider from "@material-ui/lab/Slider";

import { connect } from "react-redux";
import store from "../../redux/store";
import {
  answerMulti,
  updateImportFile,
  updateImportState
} from "../../redux/actions";

import { TypeSummary } from "./../../components";

import { getNumQuestionsForResource } from "../../utils/general-utils";

const mapState = state => ({
  currentType: state.currentType,
  suppliers: state.suppliers,
  suppliersInactive: state.suppliersInactive,
  products: state.products,
  productsInactive: state.productsInactive,
  projects: state.projects,
  projectsInactive: state.projectsInactive,
  supplierQuestions: state.supplierQuestions,
  productQuestions: state.productQuestions,
  projectQuestions: state.projectQuestions,
  supplierResponses: state.supplierResponses,
  productResponses: state.productResponses,
  projectResponses: state.projectResponses,
  importState: state.importState
});

const styles = theme => ({
  card: {
    display: "inline-flex",
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: "column",
    width: 344,
    height: 194,
    margin: 12
  },
  title: {
    fontSize: 13,
    fontWeight: "regular",
    textTransform: "capitalize"
  },
  // heading: {
  //   fontSize: 25,
  //   textTransform: "capitalize"
  // },
  // inactive: {
  //   fontSize: 16,
  //   color: "gray"
  // },
  slider: {
    padding: "22px 0px"
    // width: "90%"
  },
  thumb: {
    backgroundColor: "blue"
  },
  thumbIcon: {
    display: "flex",
    justifyContent: "center"
  }
});

class PercentageSlider extends Component {
  render() {
    const { classes } = this.props;
    return (
      <Slider
        classes={{
          container: classes.slider,
          thumb: classes.thumb,
          thumbIcon: classes.thumbIcon
        }}
        step={0.5}
        thumb={
          <div>
            <Typography style={{ paddingTop: 12 }}>
              {this.props.value.toFixed(1)}
            </Typography>
          </div>
        }
        value={this.props.value}
        onChange={this.props.onChange}
      />
    );
  }
}
PercentageSlider = withStyles(styles)(PercentageSlider);

const QUESTION_TYPES = ["Access", "Criticality", "Dependency", "Assurance"];

class QuestionStatusCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false,
      importDialogOpen: false,
      answerChance: 70,
      responseSkew: 50
    };
    QUESTION_TYPES.forEach(qt => {
      this.state[`answerChance.${qt}`] = 70;
      this.state[`responseSkew.${qt}`] = 50;
    });
  }

  componentDidUpdate = prevProps => {
    if ((this.props.importState == null) & (prevProps.importState != null)) {
      this.setState({ importDialogOpen: false });
      store.dispatch(updateImportFile({ importFile: null }));
    }
  };

  randomizeAnswers = () => {
    const randomDate = () => {
      return Date.now() - Math.random() * 604800000.0 * 4;
    };

    const getRandomAnswer = (answers, skew) => {
      const answerVals = answers
        .map((a, i) => [a.val, i])
        .sort((a, b) => a[0] - b[0]);
      const aidx = Math.min(
        Math.floor(Math.pow(Math.random(), skew) * answers.length),
        answers.length - 1
      );
      const answer = answerVals[aidx][1];
      return answer;
    };

    const type = this.props.currentType;
    let items, questions, responses;
    if (type === "suppliers") {
      items = [...this.props.suppliers];
      questions = this.props.supplierQuestions;
      responses = this.props.supplierResponses;
    } else if (type === "products") {
      items = [...this.props.products];
      questions = this.props.productQuestions;
      responses = this.props.productResponses;
    } else if (type === "projects") {
      items = [...this.props.projects].filter(proj => !!proj.parent);
      questions = this.props.projectQuestions;
      responses = this.props.projectResponses;
    }
    items.forEach(i => {
      const itemId = i.ID;
      responses = { ...(responses[itemId] || {}) };
      questions.forEach(q => {
        const qtype = q["Type of question"];
        const qkey = q.Relation;
        const answerChance = this.state[`answerChance.${qtype}`] / 100.0;
        const skew =
          1 /
          (Math.exp(this.state[`responseSkew.${qtype}`] / 100.0) /
            Math.exp(0.5)) **
            4.606;
        if (qtype === "Access") {
          const assetVal = q["Asset ID"];
          if (assetVal) {
            const assetIds = (assetVal || "").split(";").filter(v => !!v);
            assetIds.forEach(aid => {
              const qid = `${q.ID}|${aid}`;
              if (Math.random() < answerChance) {
                const answer = getRandomAnswer(q.Answers, skew);
                responses[qid] = [answer, randomDate()];
              } else {
                // question not answered
                delete responses[qid];
              }
            });
          } else {
            // all asset questions should have asset defined..
            // skip if otherwise (error?)
          }
        } else if (qkey) {
          const qvals = (i[qkey] || "").split(";").filter(v => !!v);
          qvals.forEach(qval => {
            const qid = `${q.ID}|${qval}`;
            if (Math.random() < answerChance) {
              const answer = getRandomAnswer(q.Answers, skew);
              responses[qid] = [answer, randomDate()];
            } else {
              // question not answered
              delete responses[qid];
            }
          });
        } else {
          if (Math.random() < answerChance) {
            const answer = getRandomAnswer(q.Answers, skew);
            responses[q.ID] = [answer, randomDate()];
          } else {
            // question not answered
            delete responses[q.ID];
          }
        }
      });
      store.dispatch(
        answerMulti({
          type,
          itemId,
          responses
        })
      );
    });
  };

  handleClose = () => {
    this.setState({ dialogOpen: false });
  };

  handleAnswerChance = qt => (event, value) => {
    this.setState({ [`answerChance.${qt}`]: value });
  };

  handleResponseSkew = qt => (event, value) => {
    this.setState({ [`responseSkew.${qt}`]: value });
  };

  handleImportDialogOpen = () => {
    this.setState({ importDialogOpen: true });
    store.dispatch(updateImportState({ importState: "prompting" }));
  };

  handleImportDialogClose = event => {
    this.setState({ importDialogOpen: false });
    store.dispatch(updateImportFile({ importFile: null }));
    store.dispatch(updateImportState({ importState: null }));
  };

  render() {
    const { classes } = this.props;

    const type = this.props.currentType;
    let items, questions, responses;

    if (type === "suppliers") {
      items = [...this.props.suppliers];
      // itemsInactive = [...this.props.suppliersInactive];
      questions = this.props.supplierQuestions;
      responses = this.props.supplierResponses;
    } else if (type === "products") {
      items = [...this.props.products];
      // itemsInactive = [...this.props.productsInactive];
      questions = this.props.productQuestions;
      responses = this.props.productResponses;
    } else if (type === "projects") {
      items = [...this.props.projects].filter(proj => !!proj.parent);
      // itemsInactive = [...this.props.projectsInactive];
      questions = this.props.projectQuestions;
      responses = this.props.projectResponses;
    }

    const hasAccess = questions.some(q => q["Type of question"] === "Access");
    const hasCriticality = questions.some(
      q => q["Type of question"] === "Criticality"
    );
    const hasDependency = questions.some(
      q => q["Type of question"] === "Dependency"
    );
    const hasAssurance = questions.some(
      q => q["Type of question"] === "Assurance"
    );

    const usedQuestionTypes = [
      hasAccess && "Access",
      hasCriticality && "Criticality",
      hasDependency && "Dependency",
      hasAssurance && "Assurance"
    ].filter(Boolean);

    let numCompleted = 0,
      numPartial = 0,
      numZero = 0;

    items.forEach(item => {
      let numResp = Object.keys(responses[item.ID] || []).length;
      const numQuestions = getNumQuestionsForResource(item, questions);
      if (numResp >= numQuestions) {
        numCompleted += 1;
      } else if (numResp > 0) {
        numPartial += 1;
      } else {
        numZero += 1;
      }
    });

    return (
      <Card className={classes.card}>
        <CardContent>
          <Typography gutterBottom className={classes.title}>
            {type.substring(0, type.length - 1)} question status
          </Typography>

          <TypeSummary currentType={type} />

          {/* {itemsInactive.length > 0 ? (
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <Typography gutterBottom className={classes.heading}>
                {items.length} {type}
              </Typography>
              <Typography gutterBottom className={classes.inactive}>
                &nbsp;(+ {itemsInactive.length} inactive)
              </Typography>
              <Typography gutterBottom className={classes.heading}>
                :
              </Typography>
            </div>
          ) : (
            <Typography gutterBottom className={classes.heading}>
              {items.length} {type}:
            </Typography>
          )}
          <Typography className={classes.complete} component="div">
            {numCompleted} {type} with complete data
          </Typography>
          <Typography className={classes.partial} component="div">
            {numPartial} {type} with partial data
          </Typography>
          <Typography className={classes.zero} component="div">
            {numZero} {type} with no data
          </Typography> */}
        </CardContent>
        <CardActions style={{ justifyContent: "flex-end" }}>
          {items.length === 0 ? (
            <Button
              size="small"
              color="primary"
              style={{
                fontSize: "15px",
                textAlign: "left",
                justifyContent: "left"
              }}
              onClick={this.handleImportDialogOpen}
            >
              IMPORT...
            </Button>
          ) : (
            <IconButton
              size="small"
              style={{ opacity: 0.0 }}
              onClick={() => this.setState({ dialogOpen: true })}
            >
              <GestureIcon />
            </IconButton>
          )}
        </CardActions>
        <ImportDialog
          key={type}
          type={type}
          open={this.state.importDialogOpen}
          handleClose={this.handleImportDialogClose}
        />
        <Dialog
          onClose={() => this.setState({ dialogOpen: false })}
          aria-labelledby="simulation-dialog-title"
          open={this.state.dialogOpen}
        >
          <DialogTitle id="simulation-dialog-title">
            Generate Random Answers
          </DialogTitle>
          <DialogContent
            style={{
              overflowX: "hidden"
            }}
          >
            <DialogContentText>
              This will replace all existing answers with randomly generated
              answers.
            </DialogContentText>
          </DialogContent>

          {usedQuestionTypes.map(qt => (
            <React.Fragment key={qt}>
              <DialogContent
                style={{
                  overflowX: "hidden"
                }}
              >
                <Typography variant="overline">{`${qt} Questions`}</Typography>
                <Typography>% chance question is answered</Typography>
                <PercentageSlider
                  value={this.state[`answerChance.${qt}`]}
                  onChange={this.handleAnswerChance(qt)}
                />
                <Typography>response strength</Typography>
                <PercentageSlider
                  value={this.state[`responseSkew.${qt}`]}
                  onChange={this.handleResponseSkew(qt)}
                />
              </DialogContent>
              <Divider />
            </React.Fragment>
          ))}

          <DialogActions>
            <Button onClick={this.handleClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                this.randomizeAnswers();
                this.handleClose();
              }}
              color="primary"
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>
      </Card>
    );
  }
}

export default withStyles(styles)(connect(mapState)(QuestionStatusCard));
