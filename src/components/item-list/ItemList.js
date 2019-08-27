import React, { Component } from "react";

import store from "../../redux/store";
import { updateCurrentItem, setSelectedResource } from "../../redux/actions";
import { connect } from "react-redux";

import {
  ItemVisualCard,
  TreemapCard,
  QuestionStatusCard
} from "../../components";

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
  // getQuestionResponseTimestamp,
  getNumQuestionsForResource,
  getLatestResponseForResource
} from "../../utils/general-utils";
import { Typography } from "@material-ui/core";

const MULTIPLES_POLICIES = {
  MAX: 0,
  SUM: 1,
  AVG: 2,
  ALL: 3
};

const MULTIPLES_FIELDS = {
  [MULTIPLES_POLICIES.MAX]: {
    suffixes: { sort: "max", display: "max" },
    hint: "max"
  },
  [MULTIPLES_POLICIES.SUM]: {
    suffixes: { sort: "sum", display: "sum" },
    hint: "sum"
  },
  [MULTIPLES_POLICIES.AVG]: {
    suffixes: { sort: "avg", display: "avg" },
    hint: "avg"
  },
  [MULTIPLES_POLICIES.ALL]: {
    suffixes: { sort: "sum", display: "all" },
    hint: null
  }
};

const MULTIPLES_OPTIONS = {
  Access: {
    policy: MULTIPLES_POLICIES.MAX,
    prefix: "score.access"
  },
  Dependency: {
    policy: MULTIPLES_POLICIES.MAX,
    prefix: "score.dependency"
  },
  Criticality: {
    policy: MULTIPLES_POLICIES.MAX,
    prefix: "score.criticality"
  }
};

function formatMultiplesValue(policy, val) {
  if (
    policy === MULTIPLES_POLICIES.MAX ||
    policy === MULTIPLES_POLICIES.SUM ||
    policy === MULTIPLES_POLICIES.AVG
  ) {
    return val.toFixed(1);
  } else if (policy === MULTIPLES_POLICIES.ALL) {
    // TODO: SJR
    return JSON.stringify(val);
  } else {
    return val;
  }
}

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
    // textTransform: "capitalize",
    backgroundColor: "#cbcbcb",
    borderRight: "2px solid #f8f8f8",
    paddingLeft: 12,
    paddingRight: 12,
    "&:last-child": {
      borderRight: "2px solid black"
    }
  },
  scoreCol: {
    // textTransform: "capitalize",
    backgroundColor: "#dcdcdc",
    borderRight: "2px solid #f8f8f8",
    paddingLeft: 12,
    paddingRight: 12
    // minWidth: 89
  },
  questionCol: {
    // textTransform: "capitalize",
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
    Object.entries(MULTIPLES_OPTIONS).forEach(entry => {
      const [metric, options] = entry;
      const hint = MULTIPLES_FIELDS[options.policy].hint;
      const suffixes = MULTIPLES_FIELDS[options.policy].suffixes;
      options.fields = {
        sort: `${options.prefix}.${suffixes.sort}`,
        display: `${options.prefix}.${suffixes.display}`,
        label: `${metric}${hint ? ` (${hint})` : ""}`
      };
    });
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
    if (this.state.selected) {
      store.dispatch(setSelectedResource(this.state.selected));
    }
    store.dispatch(updateCurrentItem({ currentItem: item }));
  };

  updateSortHandler = (event, sortType) => {
    if (sortType !== this.state.sortBy) {
      this.setState({ sortBy: sortType, sortDir: "asc", selected: null });
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

  getScoresMaxSumAndAvg = scores => {
    const maxscore = Math.max(...scores);
    const sumscore = scores.reduce((acc, val) => acc + val, 0);
    const avgscore = sumscore / scores.length;
    return {
      max: maxscore !== -Infinity ? maxscore : 0,
      sum: sumscore || 0,
      avg: avgscore || 0
    };
  };

  handleMultiples = (policy, multiples, field, sortField) => {
    const scores = this.getScoresMaxSumAndAvg(Object.values(multiples));
    if (policy === MULTIPLES_POLICIES.MAX) {
      return [[field, scores.max]];
    } else if (policy === MULTIPLES_POLICIES.AVG) {
      return [[field, scores.avg]];
    } else if (policy === MULTIPLES_POLICIES.SUM) {
      return [[field, scores.sum]];
    } else if (policy === MULTIPLES_POLICIES.ALL) {
      return [[field, multiples], [sortField, scores.sum]];
    }
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
    let impactTooltip = "Sort by impact";
    let interdependenceTooltip = "Sort by interdependence";
    let assuranceTooltip = "Sort by assurance";
    let accessTooltip = "Sort by access";
    let criticalityTooltip = "Sort by criticality";
    let dependencyTooltip = "Sort by dependency";

    if (type === "suppliers") {
      items = [...this.props.suppliers, ...this.props.suppliersInactive];
      // riskVal = calculateTypeRiskFromItemsRisk(this.props.suppliersRisk);
      riskSet = this.props.suppliersRisk;
      questions = this.props.supplierQuestions;
      responses = this.props.supplierResponses;
      scores = this.props.scores.supplier || {};
      impactTooltip = (
        <div>
          <div>
            The impact score indicates the highest negative potential impact if
            the supplier fails. Scored between 1 and 100, where 100 is
            catastrophic failure for the organization.
          </div>
          <br></br>
          <div>
            The impact score is derived from the scores of all supply lines in
            which the supplier participates. (Every product a supplier provides
            constitutes a separate supply line, and products used in multiple
            projects count as separate supply lines).
          </div>
          <br></br>
          <div>
            To affect this score, you most likely must change the amount of
            access a supplier has to your organization Three factors affect this
            score, and the first two are harder to change because they represent
            how important your projects are: (1) Criticality questions for
            products supplied and projects they're used in; (2) Dependency
            questions for products from this supplier; and (3) Access questions
            for this supplier and the products they supply.
          </div>
        </div>
      );
      interdependenceTooltip = (
        <div>
          <div>
            The interdependence score indicates the influence of a particular
            supplier -- how many products do they supply, and for how much of
            your organization (how many projects, programs, business units)? It
            is an unbounded score -- if a supplier supplies more products, the
            score will go up.
          </div>
          <br></br>
          <div>
            The interdependence score is the sum of all supply line scores in
            which the supplier participates (a supply line is one supplier
            supplying one product for one project).
          </div>
          <br></br>
          <div>
            Improving this score may require you to involve more suppliers, so
            you aren't overly dependent on a few suppliers, although there is
            some additional risk, and adding suppliers means more vetting.
            Reducing the number of products (through simplification or projects
            or elimination of deprecated products) can also improve this score,
            since you are reducing the total number of supply lines. Improving
            the score of individual supply lines (e.g. by reducing the level of
            access a supplier has to your organization) will help as well.
          </div>
        </div>
      );
      assuranceTooltip = (
        <div>
          <div>
            The Assurance Score indicates how completely your organization has
            implemented SCRM mitigations for a particular supplier.
          </div>
          <br></br>
          <div>
            This score is a percentage of implemented mitigations over possible
            mitigations.
          </div>
          <br></br>
          <div>
            Improving this score requires working with suppliers (e.g. ensuring
            they have insurance, fallback partnerships with other vendors,
            backup inventory).
          </div>
        </div>
      );
      accessTooltip = (
        <div>
          <div>
            The access scores indicates how much access a supplier has to your
            organization.
          </div>
          <br></br>
          <div>
            The access scores are calculated from the answers to questions that
            involve supplier access to your networks, information systems, and
            physical facilities.
          </div>
          <br></br>
          <div>
            To affect these scores, you must change the level of access a
            supplier has (and changing the answer to the question on the
            Supplier Questions screen).
          </div>
        </div>
      );
    } else if (type === "products") {
      items = [...this.props.products, ...this.props.productsInactive];
      // riskVal = calculateTypeRiskFromItemsRisk(this.props.productsRisk);
      riskSet = this.props.productsRisk;
      questions = this.props.productQuestions;
      responses = this.props.productResponses;
      scores = this.props.scores.product || {};
      impactTooltip = (
        <div>
          <div>
            The impact score indicates the highest negative potential impact if
            suppliers of this product fail. Scored between 1 and 100, where 100
            is catastrophic failure for the organization.
          </div>
          <br></br>
          <div>
            The impact score is derived from the scores for supply lines that
            include this product (if there are multiple suppliers for this
            product or the product is used in multiple projects, those are
            separate supply lines).
          </div>
          <br></br>
          <div>
            To affect this score, you most likely must change the amount of
            access suppliers of this product have to your organization. There
            are three factors that affect this score: (1) criticality questions
            for a product and the projects where it is used; (2) dependency
            questions for this product, and (3) access questions for the
            suppliers of this product.
          </div>
        </div>
      );
      interdependenceTooltip = (
        <div>
          <div>
            The interdependence score indicates the interconnected influence of
            a product -- how many suppliers supply the product, and how many
            projects is it used in (as well as the criticality of those
            suppliers and projects) It is an unbounded score -- if a product has
            more suppliers or is used in more projects, the score will go up.
          </div>
          <br></br>
          <div>
            The interdependence score is the sum of all supply line scores which
            involve the product (if there are multiple suppliers for this
            product or the product is used in multiple projects, those are
            separate supply lines).
          </div>
          <br></br>
          <div>
            Improving this score may require you to lower product and supplier
            impact scores, or simplify your supply chain (e.g. in the case that
            there are many suppliers supplying a product).
          </div>
        </div>
      );
      assuranceTooltip = (
        <div>
          <div>
            The Assurance Score indicates how completely your organization has
            implemented SCRM mitigations for suppliers of this product.
          </div>
          <br></br>
          <div>
            This score is a percentage of implemented mitigations over possible
            mitigations.
          </div>
          <br></br>
          <div>
            Improving this score requires working with suppliers (e.g. ensuring
            they have insurance, fallback partnerships with other vendors,
            backup inventory).
          </div>
        </div>
      );
      criticalityTooltip = (
        <div>
          The criticality score is based on your answers to the questions about
          criticality of a product to projects they're connected to and the
          organization as a whole.
        </div>
      );
      accessTooltip = (
        <div>
          The access score is based on your answers to the questions about
          whether products are connected to your information systems and to your
          customers' systems.
        </div>
      );
      dependencyTooltip = (
        <div>
          The dependency score is based on your answers to the questions about
          your reliance on a product -- e.g. can you switch to another product
          if necessary? Do you maintain a reserve?
        </div>
      );
    } else if (type === "projects") {
      items = [...this.props.projects, ...this.props.projectsInactive].filter(
        proj => !!proj.parent
      );
      // riskVal = calculateTypeRiskFromItemsRisk(this.props.projectsRisk);
      riskSet = this.props.projectsRisk;
      questions = this.props.projectQuestions;
      responses = this.props.projectResponses;
      scores = this.props.scores.project || {};
      impactTooltip = (
        <div>
          <div>
            The impact score indicates the highest negative potential impact if
            the project fails. Scored between 1 and 100, where 100 is
            catastrophic failure for the organization.
          </div>
          <br></br>
          <div>
            The impact score is derived from the scores of supply lines that
            involve the project (all products used in this project from all
            suppliers).
          </div>
          <br></br>
          <div>
            To affect this score, you must consider three factors: (1)
            criticality questions for the project as well as the products
            supplied to the project; (2) dependency questions for the products
            and suppliers that supply them; (3) access questions for the
            suppliers that supply products for this project). Because this is a
            "worst case" score, focus on the products and suppliers with the
            greatest impact scores first.
          </div>
        </div>
      );
      interdependenceTooltip = (
        <div>
          <div>
            The interdependence score indicates the interconnected nature of a
            project -- because it may involve many products from many suppliers.
            It is an unbounded score -- if a project involves more products
            and/or more suppliers, the score will go up.
          </div>
          <br></br>
          <div>
            The interdependence score is the sum of all supply line scores that
            lead to the project (all products and suppliers connected to this
            project).
          </div>
          <br></br>
          <div>
            Improving this score may require you to simplify your supply chain
            (using fewer products or suppliers for a project) or reducing impact
            scores for the products and suppliers connected to this project.
          </div>
        </div>
      );
      assuranceTooltip = (
        <div>
          <div>
            The Assurance Score indicates how completely your organization has
            implemented SCRM mitigations for suppliers connected with this
            project.
          </div>
          <br></br>
          <div>
            This score is a percentage of implemented mitigations over possible
            mitigations.
          </div>
          <br></br>
          <div>
            Improving this score requires working with suppliers (e.g. ensuring
            they have insurance, fallback partnerships with other vendors,
            backup inventory).
          </div>
        </div>
      );
      criticalityTooltip = (
        <div>
          The criticality score is based on your answer to the question about
          how critical this project is to your company/business/mission.
        </div>
      );
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
        // tooltip: "Sort by impact",
        tooltip: impactTooltip,
        cssClass: classes.metricCol,
        sortType: "score.impact"
      },
      {
        label: "Interdependence",
        tooltip: interdependenceTooltip,
        cssClass: classes.metricCol,
        sortType: "score.interdependence"
      },
      {
        label: "Assurance",
        tooltip: assuranceTooltip,
        cssClass: classes.metricCol,
        sortType: "score.assurance"
      },
      hasCriticality && {
        label: MULTIPLES_OPTIONS.Criticality.fields.label,
        tooltip: criticalityTooltip,
        cssClass: classes.scoreCol,
        sortType: MULTIPLES_OPTIONS.Criticality.fields.sort
      },
      hasAccess && {
        label: MULTIPLES_OPTIONS.Access.fields.label,
        tooltip: accessTooltip,
        cssClass: classes.scoreCol,
        sortType: MULTIPLES_OPTIONS.Access.fields.sort
      },
      hasDependency && {
        label: MULTIPLES_OPTIONS.Dependency.fields.label,
        tooltip: dependencyTooltip,
        cssClass: classes.scoreCol,
        sortType: MULTIPLES_OPTIONS.Dependency.fields.sort
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
        // itemScores.impact = -Infinity;
        listItem["score.impact"] = itemScores.impact || 0;
        listItem["score.interdependence"] = itemScores.interdependence || 0;
        listItem["score.assurance"] = itemScores.assurance || 0;

        // the following must be in this order
        if (hasCriticality) {
          const fields = this.handleMultiples(
            MULTIPLES_OPTIONS.Criticality.policy,
            riskSet[item.ID].Criticality,
            MULTIPLES_OPTIONS.Criticality.fields.display
          );
          fields.forEach(entry => (listItem[entry[0]] = entry[1]));
        }
        if (hasAccess) {
          const fields = this.handleMultiples(
            MULTIPLES_OPTIONS.Access.policy,
            riskSet[item.ID].Access,
            MULTIPLES_OPTIONS.Access.fields.display
          );
          fields.forEach(entry => (listItem[entry[0]] = entry[1]));
          // const scores = this.getScoresMaxSumAndAvg(
          //   Object.values(riskSet[item.ID].Access)
          // );
          // listItem["score.access.max"] = scores.max;
        }
        if (hasDependency) {
          const fields = this.handleMultiples(
            MULTIPLES_OPTIONS.Dependency.policy,
            riskSet[item.ID].Dependency,
            MULTIPLES_OPTIONS.Dependency.fields.display
          );
          fields.forEach(entry => (listItem[entry[0]] = entry[1]));
          // const scores = this.getScoresMaxSumAndAvg(
          //   Object.values(riskSet[item.ID].Dependency)
          // );
          // listItem["score.dependency.max"] = scores.max;
        }

        const numQuestions = getNumQuestionsForResource(item, questions);
        listItem.completion =
          100 * (Object.keys(responses[item.ID]).length / numQuestions);
        const lastResponded = getLatestResponseForResource(
          responses[item.ID] || {}
        );
        // Math.max(
        //   ...Object.values(responses[item.ID] || {})
        //     .map(val => getQuestionResponseTimestamp(val))
        //     .filter(val => !!val)
        // );

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
        // make sure selected always sorts first
        selectedItem.delta = -1;
        list.forEach(row => {
          if (row.delta == null) {
            row.delta = Math.abs((row["score.impact"] || 0) - selectedImpact);
          }
        });
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
          (row[MULTIPLES_OPTIONS.Criticality.fields.display] != null
            ? formatMultiplesValue(
                MULTIPLES_OPTIONS.Criticality.policy,
                row[MULTIPLES_OPTIONS.Criticality.fields.display]
              )
            : "N/A"),
        hasAccess &&
          (row[MULTIPLES_OPTIONS.Access.fields.display] != null
            ? formatMultiplesValue(
                MULTIPLES_OPTIONS.Access.policy,
                row[MULTIPLES_OPTIONS.Access.fields.display]
              )
            : "N/A"),
        hasDependency &&
          (row[MULTIPLES_OPTIONS.Dependency.fields.display] != null
            ? formatMultiplesValue(
                MULTIPLES_OPTIONS.Dependency.policy,
                row[MULTIPLES_OPTIONS.Dependency.fields.display]
              )
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
            {selectedItem && selectedItem.ID === row.ID && (
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
          <TreemapCard />
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
