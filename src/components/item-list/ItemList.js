import React, { Component } from "react";

import store from "../../redux/store";
import { updateCurrentItem, setSelectedResource } from "../../redux/actions";
import { connect } from "react-redux";

import { ItemVisualCard, QuestionStatusCard } from "../../components";

// import { calculateTypeRiskFromItemsRisk } from '../../utils/risk-calculations';

import { withStyles } from "@material-ui/core/styles";

import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Tooltip from "@material-ui/core/Tooltip";

import {
  getQuestionResponseTimestamp,
  getNumQuestionsForResource
} from "../../utils/general-utils";
import { Typography } from "@material-ui/core";

function getAge(diff) {
  const formatResult = (val, unit) => {
    const rval = Math.round(val);
    return `${rval} ${unit}${rval > 1 ? "s" : ""} ago`;
  };

  if (diff === Infinity || diff == null) {
    return "---";
  } else if (diff >= 604800000.0) {
    return formatResult(diff / 604800000.0, "week");
  } else if (diff >= 86400000.0) {
    return formatResult(diff / 86400000.0, "day");
  } else if (diff >= 3600000.0) {
    return formatResult(diff / 3600000.0, "hour");
  } else if (diff >= 60000.0) {
    return formatResult(diff / 60000.0, "minute");
  } else {
    return "less than 1 minute ago";
  }
}

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
  suppliersRisk: state.suppliersRisk,
  productsRisk: state.productsRisk,
  projectsRisk: state.projectsRisk,
  supplierResponses: state.supplierResponses,
  productResponses: state.productResponses,
  projectResponses: state.projectResponses,
  scores: state.scores,
  selected: state.selectedResource
});

const styles = theme => ({
  itemList: {
    margin: 34
  },
  overview: {
    marginLeft: -12,
    marginRight: -12,
    display: "inline-flex"
  },
  table: {
    // marginBottom: 96
  },
  cell: {
    borderRight: "2px solid #f8f8f8",
    paddingLeft: 12,
    paddingRight: 12
  },
  lastOfCell: {
    borderRight: "2px solid #dcdcdc",
    paddingLeft: 12,
    paddingRight: 12
  },
  cellInactive: {
    color: "gray"
  },
  titleCol: {
    textTransform: "uppercase",
    backgroundColor: "#dcdcdc",
    borderRight: "2px solid #f8f8f8",
    // borderRight: "2px solid #dcdcdc",
    paddingLeft: 12,
    paddingRight: 12,
    minWidth: 180
  },
  metricCol: {
    textTransform: "capitalize",
    backgroundColor: "#cbcbcb",
    borderRight: "2px solid #f8f8f8",
    paddingLeft: 12,
    paddingRight: 12,
    "&:last-child": {
      borderRight: "2px solid black"
    }
  },
  scoreCol: {
    textTransform: "capitalize",
    backgroundColor: "#dcdcdc",
    borderRight: "2px solid #f8f8f8",
    paddingLeft: 12,
    paddingRight: 12
    // minWidth: 89
  },
  questionCol: {
    textTransform: "capitalize",
    backgroundColor: "#ededed",
    borderRight: "2px solid #f8f8f8",
    paddingLeft: 12,
    paddingRight: 12
  },
  button: {
    textTransform: "uppercase",
    width: 72,
    height: 27
  },
  scoreColPart: {
    display: "inline-block",
    textAlign: "right",
    paddingRight: 6,
    minWidth: 54
    // width: "50%"
  },
  scoreBars: {
    height: 15,
    display: "inline-block",
    backgroundColor: "#7f7f7f",
    verticalAlign: "middle"
  }
});

class ItemList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sortBy:
        props.selected && props.selected.resourceType === props.currentType
          ? "delta"
          : "Name",
      sortDir: "asc",
      selected: props.selected
    };
  }

  handleItemSelection = (event, item) => {
    store.dispatch(updateCurrentItem({ currentItem: item }));
  };

  updateSortHandler = (event, sortType) => {
    if (sortType !== this.state.sortBy) {
      this.setState({ sortBy: sortType, sortDir: "asc" });
    } else {
      let newSortDir = "asc";
      if (this.state.sortDir === "asc") {
        newSortDir = "desc";
      }
      this.setState({ sortDir: newSortDir, selected: null });
    }
  };

  componentWillMount = () => {
    if (this.props.selected) {
      store.dispatch(setSelectedResource(null));
    }
  };

  componentDidMount = () => {
    window.scrollTo(0, 0);
  };

  getScoresMaxAndAvg = scores => {
    const maxscore = Math.max(...scores);
    const avgscore = scores.reduce((acc, val) => acc + val, 0) / scores.length;
    return {
      max: maxscore !== -Infinity ? maxscore : 0,
      avg: avgscore || 0
    };
  };

  render() {
    const { classes, currentType: type } = this.props;
    const { selected } = this.state;

    if (type == null) {
      return (
        <div className={"item-list"}>
          Current type is null in the current session.
        </div>
      );
    }

    let items = null;
    let questions = null;
    let responses = null;
    // let riskVal = null;
    let riskSet = null;
    let scores = null;
    if (type === "suppliers") {
      items = [...this.props.suppliers, ...this.props.suppliersInactive];
      // riskVal = calculateTypeRiskFromItemsRisk(this.props.suppliersRisk);
      riskSet = this.props.suppliersRisk;
      questions = this.props.supplierQuestions;
      responses = this.props.supplierResponses;
      scores = this.props.scores.supplier || {};
    } else if (type === "products") {
      items = [...this.props.products, ...this.props.productsInactive];
      // riskVal = calculateTypeRiskFromItemsRisk(this.props.productsRisk);
      riskSet = this.props.productsRisk;
      questions = this.props.productQuestions;
      responses = this.props.productResponses;
      scores = this.props.scores.product || {};
    } else if (type === "projects") {
      items = [...this.props.projects, ...this.props.projectsInactive].filter(
        proj => !!proj.parent
      );
      // riskVal = calculateTypeRiskFromItemsRisk(this.props.projectsRisk);
      riskSet = this.props.projectsRisk;
      questions = this.props.projectQuestions;
      responses = this.props.projectResponses;
      scores = this.props.scores.project || {};
    }

    const hasCriticality = questions.some(
      q => q["Type of question"] === "Criticality"
    );
    const hasAccess = questions.some(q => q["Type of question"] === "Access");
    const hasDependency = questions.some(
      q => q["Type of question"] === "Dependency"
    );

    const headerDetails = [
      {
        label: type.substring(0, type.length - 1),
        tooltip: "Sort by name",
        cssClass: classes.titleCol,
        sortType: "Name"
      },
      {
        label: "Impact",
        tooltip: "Sort by impact",
        cssClass: classes.metricCol,
        sortType: "score.impact"
      },
      {
        label: "Interdependence",
        tooltip: "Sort by interdependence",
        cssClass: classes.metricCol,
        sortType: "score.interdependence"
      },
      {
        label: "Assurance",
        tooltip: "Sort by assurance",
        cssClass: classes.metricCol,
        sortType: "score.assurance"
      },
      hasCriticality && {
        label: "Criticality",
        tooltip: "Sort by criticality",
        cssClass: classes.scoreCol,
        sortType: "score.criticality.max"
      },
      hasAccess && {
        label: "Access",
        tooltip: "Sort by access",
        cssClass: classes.scoreCol,
        sortType: "score.access.max"
      },
      hasDependency && {
        label: "Dependency",
        tooltip: "Sort by dependency",
        cssClass: classes.scoreCol,
        sortType: "score.dependency.max"
      },
      {
        label: "Questions Complete",
        tooltip: "Sort by completion",
        cssClass: classes.questionCol,
        sortType: "completion"
      },
      {
        label: "Question Age",
        tooltip: "Sort by age",
        cssClass: classes.questionCol,
        sortType: "age"
      },
      {
        label: "Action",
        tooltip: "Sort by action",
        cssClass: classes.questionCol,
        sortType: "action"
      }
    ].filter(Boolean);

    const rowHeaders = headerDetails.map((col, i) => (
      <TableCell key={i} className={col.cssClass}>
        <Tooltip
          title={col.tooltip}
          placement={"bottom-start"}
          enterDelay={300}
        >
          <TableSortLabel
            active={this.state.sortBy === col.sortType}
            direction={this.state.sortDir}
            onClick={e => this.updateSortHandler(e, col.sortType)}
          >
            {col.label}
          </TableSortLabel>
        </Tooltip>
      </TableCell>
    ));

    const now = Date.now();
    const list = items.map(item => {
      // shouldn't modify items in place; keep reference to original item
      const listItem = { ...item, item };
      if (
        item._cscrm_active &&
        riskSet.hasOwnProperty(item.ID) &&
        responses[item.ID]
      ) {
        const itemScores = scores[item.ID] || {};
        listItem["score.impact"] = itemScores.impact || 0;
        listItem["score.interdependence"] = itemScores.interdependence || 0;
        listItem["score.assurance"] = itemScores.assurance || 0;

        // the following must be in this order
        if (hasCriticality) {
          const scores = this.getScoresMaxAndAvg(
            Object.values(riskSet[item.ID].Criticality)
          );
          listItem["score.criticality.max"] = scores.max;
        }
        if (hasAccess) {
          const scores = this.getScoresMaxAndAvg(
            Object.values(riskSet[item.ID].Access)
          );
          listItem["score.access.max"] = scores.max;
        }
        if (hasDependency) {
          const scores = this.getScoresMaxAndAvg(
            Object.values(riskSet[item.ID].Dependency)
          );
          listItem["score.dependency.max"] = scores.max;
        }

        const numQuestions = getNumQuestionsForResource(item, questions);
        listItem.completion =
          100 * (Object.keys(responses[item.ID]).length / numQuestions);
        const lastResponded = Math.max(
          ...Object.values(responses[item.ID] || {})
            .map(val => getQuestionResponseTimestamp(val))
            .filter(val => !!val)
        );
        listItem.age = now - lastResponded; // will be infinity if no responses
        listItem.action =
          Object.keys(responses[item.ID]).length === 0 ? "Start" : "Edit";
      }
      return listItem;
    });

    const maxImpact = Math.max(...list.map(row => row["score.impact"] || 0));
    const maxInterdependence = Math.max(
      ...list.map(row => row["score.interdependence"] || 0)
    );
    const maxAssurance = Math.max(
      ...list.map(row => row["score.assurance"] || 0)
    );

    let selectedItem;
    if (selected && selected.resourceType === type) {
      selectedItem = list.filter(row => row.ID === selected.resourceId)[0];
      if (selectedItem) {
        const selectedImpact = selectedItem["score.impact"] || 0;
        list.forEach(
          row =>
            (row["delta"] = Math.abs(
              (row["score.impact"] || 0) - selectedImpact
            ))
        );
      }
    }

    list.sort((a, b) => {
      if (a._cscrm_active > b._cscrm_active) {
        return -1;
      } else if (a._cscrm_active < b._cscrm_active) {
        return 1;
      }
      if (this.state.sortDir === "asc") {
        if (a[this.state.sortBy] > b[this.state.sortBy]) return 1;
        if (b[this.state.sortBy] > a[this.state.sortBy]) return -1;
        return 0;
      } else {
        if (a[this.state.sortBy] < b[this.state.sortBy]) return 1;
        if (b[this.state.sortBy] < a[this.state.sortBy]) return -1;
        return 0;
      }
    });

    const rows = list.map((row, i) => {
      const scoreValues = [
        hasCriticality &&
          (row["score.criticality.max"] != null
            ? row["score.criticality.max"].toFixed(1)
            : "N/A"),
        hasAccess &&
          (row["score.access.max"] != null
            ? row["score.access.max"].toFixed(1)
            : "N/A"),
        hasDependency &&
          (row["score.dependency.max"] != null
            ? row["score.dependency.max"].toFixed(1)
            : "N/A")
      ].filter(Boolean);
      return row._cscrm_active ? (
        <TableRow key={row.ID}>
          <TableCell
            className={classes.lastOfCell}
            // style={
            //   i === 0 && selectedItem && selectedItem.ID === row.ID
            //     ? { fontWeight: "bold", fontSize: 16 }
            //     : null
            // }
          >
            {i === 0 && selectedItem && selectedItem.ID === row.ID && (
              <span>&rArr;&nbsp;</span>
            )}
            {row.Name}
          </TableCell>
          <TableCell className={classes.cell} style={{ whiteSpace: "nowrap" }}>
            <div className={classes.scoreColPart}>
              {row["score.impact"] != null
                ? row["score.impact"].toFixed(1)
                : "---"}
            </div>
            <div
              className={classes.scoreBars}
              style={{
                width: ((row["score.impact"] || 0) / maxImpact || 0) * 40
              }}
            />
          </TableCell>

          <TableCell className={classes.cell} style={{ whiteSpace: "nowrap" }}>
            <div className={classes.scoreColPart}>
              {row["score.interdependence"] != null
                ? row["score.interdependence"].toFixed(1)
                : "---"}
            </div>
            <div
              className={classes.scoreBars}
              style={{
                width:
                  ((row["score.interdependence"] || 0) / maxInterdependence ||
                    0) * 40
              }}
            />
          </TableCell>

          <TableCell
            className={classes.lastOfCell}
            style={{
              whiteSpace: "nowrap",
              borderRight: "2px solid #dcdcdc"
            }}
          >
            <div className={classes.scoreColPart}>
              {row["score.assurance"] != null
                ? row["score.assurance"].toFixed(1)
                : "---"}
            </div>
            <div
              className={classes.scoreBars}
              style={{
                width: ((row["score.assurance"] || 0) / maxAssurance || 0) * 40
              }}
            />
          </TableCell>

          {scoreValues.map((val, i) => (
            <TableCell
              key={i}
              className={
                i === scoreValues.length - 1 ? classes.lastOfCell : classes.cell
              }
            >
              {val}
            </TableCell>
          ))}

          <TableCell className={classes.cell}>
            {(row.completion || 0).toFixed(1)}%
          </TableCell>
          <TableCell className={classes.cell} style={{ whiteSpace: "nowrap" }}>
            {getAge(row.age)}
          </TableCell>
          <TableCell className={classes.cell}>
            <Button
              variant="contained"
              size="small"
              color={
                Object.keys(responses[row.ID] || {}).length === 0
                  ? "secondary"
                  : "primary"
              }
              className={classes.button}
              onClick={e => this.handleItemSelection(e, row.item)}
            >
              {(() => {
                if (Object.keys(responses[row.ID] || {}).length === 0) {
                  return "Start...";
                } else {
                  return "Edit...";
                }
              })()}
            </Button>
          </TableCell>
        </TableRow>
      ) : (
        <TableRow key={row.ID}>
          <TableCell
            className={classes.cell}
            style={{ color: "gray", fontStyle: "italic" }}
          >
            {row.Name + " (inactive)"}
          </TableCell>
          <TableCell />
          <TableCell />
          <TableCell />
          <TableCell />
        </TableRow>
      );
    });

    return (
      <div className={classes.itemList}>
        <div className={classes.overview}>
          <ItemVisualCard />
          <QuestionStatusCard />
        </div>
        {rows.length > 0 ? (
          <Table className={classes.table}>
            <TableHead>
              <TableRow>{rowHeaders}</TableRow>
            </TableHead>
            <TableBody>{rows}</TableBody>
          </Table>
        ) : (
          <Typography variant="h5" style={{ textAlign: "center" }}>
            {`Please import ${type} data.`}
          </Typography>
        )}
        {/* <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    open={true}
                    ContentProps={{
                        'aria-describedby': 'message-id',
                    }}
                    message={<span id="message-id">Current {type} questionnaire score: {riskVal.toFixed(1)}</span>}
                /> */}
      </div>
    );
  }
}

export default withStyles(styles)(connect(mapState)(ItemList));
