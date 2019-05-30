import React, { Component } from 'react';

import store from '../../redux/store';
import { updateCurrentItem } from "../../redux/actions";
import { connect } from "react-redux";

import { ItemVisualCard, QuestionStatusCard } from '../../components';

// import { calculateTypeRiskFromItemsRisk } from '../../utils/risk-calculations';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';

import { getQuestionResponseTimestamp } from '../../utils/question-responses';

function getAge(diff) {
    const formatResult = (val, unit) => {
        const rval = Math.round(val);
        return `${rval} ${unit}${rval > 1 ? "s" : ""} ago`;
    }

    if (diff === Infinity) {
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
    projectResponses: state.projectResponses
});

const styles = theme => ({
    itemList: {
        margin: 34
    },
    overview: {
        marginLeft: -12,
        marginRight: -12,
        display: 'inline-flex',
    },
    table: {
        // marginBottom: 96
    },
    cell: {
        borderRight: '2px solid #f8f8f8',
    },
    cellInactive: {
        color: "gray"
    },
    titleCol: {
        textTransform: 'uppercase',
        backgroundColor: '#dcdcdc',
        borderRight: '2px solid #f8f8f8',
        minWidth: 467,
    },
    regCol: {
        textTransform: 'capitalize',
        backgroundColor: '#dcdcdc',
        borderRight: '2px solid #f8f8f8',
    },
    button: {
        textTransform: 'uppercase',
        width: 72,
        height: 27,
    },
    scoreColPart: {
        display: "inline-block",
        width: "50%"
    },
    scoreBars: {
        height: 15,
        backgroundColor: "#7f7f7f",
        verticalAlign: "middle"
    }
});

class ItemList extends Component {
    state = {
        sortBy: 'Name',
        sortDir: 'asc'
    };

    handleItemSelection = (event, item) => {
        store.dispatch(updateCurrentItem({currentItem: item}));
    }

    updateSortHandler = (event, sortType) => {
        if (sortType !== this.state.sortBy){
            this.setState({ sortBy: sortType, sortDir: 'asc' });
        } else {
            let newSortDir = 'asc';
            if (this.state.sortDir === 'asc'){
                newSortDir = 'desc';
            }
            this.setState({ sortDir: newSortDir });
        }
    }

    componentDidMount = () => {
        window.scrollTo(0, 0);
    }
    
    render() {
        const { classes } = this.props;
        if (this.props.currentType == null){
            return <div className={"item-list"}>Current type is null in the current session.</div>;
        }

        let type = this.props.currentType;

        let list = null;
        let questions = null;
        let responses = null;
        // let riskVal = null;
        let riskSet = null;
        if (type === "suppliers"){
            list = [...this.props.suppliers, ...this.props.suppliersInactive];
            // riskVal = calculateTypeRiskFromItemsRisk(this.props.suppliersRisk);
            riskSet = this.props.suppliersRisk;
            questions = this.props.supplierQuestions;
            responses = this.props.supplierResponses;
        } else if (type === "products"){
            list = [...this.props.products, ...this.props.productsInactive];
            // riskVal = calculateTypeRiskFromItemsRisk(this.props.productsRisk);
            riskSet = this.props.productsRisk;
            questions = this.props.productQuestions;
            responses = this.props.productResponses;
        } else if (type === "projects"){
            list = [...this.props.projects, ...this.props.projectsInactive];
            // riskVal = calculateTypeRiskFromItemsRisk(this.props.projectsRisk);
            riskSet = this.props.projectsRisk;
            questions = this.props.projectQuestions;
            responses = this.props.projectResponses;
        }

        const hasImpact = (questions.some(q => q['Type of question'] === "impact"));
        const hasCriticality = (questions.some(q => q['Type of question'] === "criticality"));

        const headerDetails = [
            {
                label: type.substring(0, type.length - 1),
                tooltip: "Sort by name",
                cssClass: classes.titleCol,
                sortType: 'Name'
            },
            hasCriticality && {
                label: "Criticality",
                tooltip: "Sort by criticality",
                cssClass: classes.regCol,
                sortType: 'risk.criticality.max'
            },
            hasImpact && {
                label: 'Questionnaire Score',
                tooltip: "Sort by questionnaire score",
                cssClass: classes.regCol,
                sortType: 'risk.impact'
            },
            {
                label: 'Questions Complete',
                tooltip: "Sort by completion",
                cssClass: classes.regCol,
                sortType: 'completion'
            },
            {
                label: 'Question Age',
                tooltip: "Sort by age",
                cssClass: classes.regCol,
                sortType: 'age'
            },
            {
                label: 'Action',
                tooltip: "Sort by action",
                cssClass: classes.regCol,
                sortType: 'action'
            },
        ].filter(Boolean);

        const rowHeaders = headerDetails.map((col, i) => (
            <TableCell key={i} className={col.cssClass}>
                <Tooltip
                    title={col.tooltip}
                    placement={'bottom-start'}
                    enterDelay={300}
                >
                    <TableSortLabel
                        active={this.state.sortBy === col.sortType}
                        direction={this.state.sortDir}
                        onClick={(e) => this.updateSortHandler(e, col.sortType)}
                    >
                        {col.label}
                    </TableSortLabel>
                </Tooltip> 
            </TableCell>
        ));

        const now = Date.now();
        list.forEach((item) => {
            if (item._cscrm_active && riskSet.hasOwnProperty(item.ID) && responses[item.ID]) {
                item['risk.impact'] = riskSet[item.ID].impact;
                if (hasCriticality) {
                    item['risk.criticality.max'] = Math.max(...Object.values(riskSet[item.ID].criticality));
                }
                item.completion = 100 * (Object.keys(responses[item.ID]).length / questions.length);
                const lastResponded = Math.max(...Object.values(responses[item.ID] || {}).map(val => getQuestionResponseTimestamp(val)).filter(val => !!val));
                item.age = now - lastResponded; // will be infinity if no responses
                item.action = (Object.keys(responses[item.ID]).length === 0 ? "Start" : "Edit");
            }
        });

        list.sort((a, b) => {
            if (a._cscrm_active > b._cscrm_active) {
                return -1;
            } else if (a._cscrm_active < b._cscrm_active) {
                return 1;
            }
            if (this.state.sortDir === 'asc') {
                if (a[this.state.sortBy] > b[this.state.sortBy]) return 1;
                if (b[this.state.sortBy] > a[this.state.sortBy]) return -1;
                return 0;
            } else {
                if (a[this.state.sortBy] < b[this.state.sortBy]) return 1;
                if (b[this.state.sortBy] < a[this.state.sortBy]) return -1;
                return 0;
            } 
        });

        const rows = list.map((row, i) => row._cscrm_active ? (
            <TableRow key={row.ID}>
                <TableCell className={classes.cell}>
                    {row.Name}
                </TableCell>
                {hasCriticality && (
                    <TableCell className={classes.cell}>
                        {row['risk.criticality.max'] != null ? row['risk.criticality.max'].toFixed(1) : "N/A"}
                    </TableCell>
                )}
                {hasImpact && (
                    <TableCell className={classes.cell} style={{whiteSpace: "nowrap"}}>
                        <div className={classes.scoreColPart}>
                            {(() => {
                                if (riskSet.hasOwnProperty(row.ID)) return riskSet[row.ID].impact.toFixed(1);
                                else return "N/A";
                            })()}
                        </div>
                        <div className={[classes.scoreColPart, classes.scoreBars].join(' ')} style={{width: riskSet[row.ID].impact}}></div>
                    </TableCell>
                )}
                <TableCell className={classes.cell}>
                    {(() => {
                        return (100 * (Object.keys(responses[row.ID] || {}).length / questions.length)).toFixed(1);
                    })()}%
                </TableCell>
                <TableCell className={classes.cell}>
                    {getAge(row.age)}
                </TableCell>
                <TableCell className={classes.cell}>
                    <Button
                      variant="contained"
                      size="small"
                      color={Object.keys(responses[row.ID] || {}).length === 0 ? "secondary" : "primary"}
                      className={classes.button}
                      onClick={(e) => this.handleItemSelection(e, row)}
                    >
                        {(() => {
                            if (Object.keys(responses[row.ID] || {}).length === 0){
                                return "Start...";
                            } else {
                                return "Edit...";
                            }
                        })()}
                    </Button>
                </TableCell>
            </TableRow>) : (
                <TableRow key={row.ID}>
                    <TableCell className={classes.cell} style={{color:"gray", fontStyle:"italic"}}>
                        {row.Name + " (inactive)"}
                    </TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell />
                </TableRow>
            )
        )

        return (
            <div className={classes.itemList}>
                <div className={classes.overview}>
                    <ItemVisualCard />
                    <QuestionStatusCard />
                </div>
                <Table className={classes.table}>
                    <TableHead>
                        <TableRow>
                            {rowHeaders}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows}
                    </TableBody>
                </Table>
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