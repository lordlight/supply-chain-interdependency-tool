import React, { Component } from "react";

import { withStyles } from "@material-ui/core/styles";

import { ActionCard } from "../../components/";
import {
  getNumQuestionsForResource,
  getLatestResponseForResource
} from "../../utils/general-utils";

import { connect } from "react-redux";

const styles = theme => ({
  card: {
    display: "inline-flex",
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: "column",
    width: 344,
    margin: 12,
    position: "relative",
    minHeight: 296
  },
  content: {
    position: "relative"
  },
  desc: {
    fontSize: "15px",
    height: "48px",
    overflow: "hidden",
    lineHeight: "1",
    textOverflow: "ellipsis"
  },
  media: {
    height: 194,
    width: 344
  },
  paper: {
    position: "absolute",
    width: theme.spacing.unit * 50,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
    outline: "none"
  },
  img: {
    position: "absolute",
    top: theme.spacing.unit * 2,
    right: theme.spacing.unit * 2,
    maxWidth: 80,
    maxHeight: 80,
    width: "auto",
    height: "auto"
  },
  title: {
    fontSize: 13,
    fontWeight: "regular",
    textTransform: "uppercase"
  },
  heading: {
    fontSize: 25,
    paddingBottom: 24,
    textTransform: "capitalize"
  },
  item: {
    color: "rgba(0, 0, 0, 0.6)"
  }
});

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
  projectResponses: state.projectResponses
});

class TodosCard extends Component {
  importTodoItem = (resources, resourceLabel) => {
    return (resources || []).length === 0
      ? `Import ${resourceLabel} data (CSV)`
      : null;
  };

  answerQuestionsTodoItem = (
    resources,
    questions,
    responses,
    resourcesLabel,
    resourcesLabelPlural
  ) => {
    let numCompleted = 0,
      numPartial = 0,
      numZero = 0;
    resources.forEach(item => {
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
    const incomplete = numPartial + numZero;
    return incomplete > 0
      ? `Answer questions for ${incomplete} ${
          incomplete === 1 ? resourcesLabel : resourcesLabelPlural
        }`
      : null;
  };

  responseAgeTodoItem = (resources, allResponses, resourceLabel) => {
    const now = Date.now();
    const timestamps = resources
      .map(r => (allResponses || {})[r.ID] || {})
      .map(responses => getLatestResponseForResource(responses));
    const oldest = Math.min(...timestamps.filter(t => t !== -Infinity));
    const diff = now - oldest;
    return diff > 7884000000
      ? `Revisit ${resourceLabel} questions aged > 3 months`
      : null;
  };

  resourceTodoItems = () => {
    const {
      suppliers,
      supplierResponses,
      supplierQuestions,
      products,
      productResponses,
      productQuestions,
      projects: allProjects,
      projectResponses,
      projectQuestions
    } = this.props;

    const projects = allProjects.filter(p => !!p.parent);

    const importItems = [
      [suppliers, "supplier"],
      [products, "product"],
      [projects, "project"]
    ]
      .map(entry => this.importTodoItem(...entry))
      .filter(Boolean);

    const answerItems = [
      [
        suppliers,
        supplierQuestions,
        supplierResponses,
        "supplier",
        "suppliers"
      ],
      [products, productQuestions, productResponses, "product", "products"],
      [projects, projectQuestions, projectResponses, "project", "projects"]
    ]
      .map(entry => this.answerQuestionsTodoItem(...entry))
      .filter(Boolean);

    const reviewItems =
      importItems.length === 0
        ? ["Review visualizations to evaluate priorities"]
        : [];

    const ageItems = [
      [suppliers, supplierResponses, "supplier"],
      [products, productResponses, "product"],
      [projects, projectResponses, "project"]
    ]
      .map(entry => this.responseAgeTodoItem(...entry))
      .filter(Boolean);

    return [...importItems, ...answerItems, ...reviewItems, ...ageItems];
  };

  render = () => {
    const resourceTodos = this.resourceTodoItems();

    return (
      <ActionCard
        type="checklist"
        items={resourceTodos}
        title="To Do"
        plural="To Do Items"
        emptyMessage="You have no to do items"
      />
    );
  };
}

export default withStyles(styles)(connect(mapState)(TodosCard));
