import React, { Component } from 'react';

import store from '../../redux/store';
import { updateCurrentItem } from "../../redux/actions";
import { connect } from "react-redux";

import { ItemVisualCard, QuestionStatusCard } from '../../components';

import { calculateTypeRiskFromItemsRisk } from '../../utils/risk-calculations';

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

const mapState = state => ({
    currentType: state.currentType,
    suppliers: state.suppliers,
    products: state.products,
    projects: state.projects,
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
        
    },
    cell: {
        borderRight: '2px solid #f8f8f8',
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

    render() {
        const { classes } = this.props;
        if (this.props.currentType == null){
            return <div className={"item-list"}>Current type is null in the current session.</div>;
        }

        let type = this.props.currentType;

        let list = null;
        let questions = null;
        let responses = null;
        let riskVal = null;
        let riskSet = null;
        if (type === "suppliers"){
            list = [...this.props.suppliers];
            riskVal = calculateTypeRiskFromItemsRisk(this.props.suppliersRisk);
            riskSet = this.props.suppliersRisk;
            questions = this.props.supplierQuestions;
            responses = this.props.supplierResponses;
        } else if (type === "products"){
            list = [...this.props.products];
            riskVal = calculateTypeRiskFromItemsRisk(this.props.productsRisk);
            riskSet = this.props.productsRisk;
            questions = this.props.productQuestions;
            responses = this.props.productResponses;
        } else if (type === "projects"){
            list = [...this.props.projects];
            riskVal = calculateTypeRiskFromItemsRisk(this.props.projectsRisk);
            riskSet = this.props.projectsRisk;
            questions = this.props.projectQuestions;
            responses = this.props.projectResponses;
        }

        const headerDetails = [
            {
                label: type.substring(0, type.length - 1),
                tooltip: "Sort by name",
                cssClass: classes.titleCol,
                sortType: 'Name'
            },
            {
                label: 'Risk',
                tooltip: "Sort by risk",
                cssClass: classes.regCol,
                sortType: 'risk'
            },
            {
                label: 'Risk',
                tooltip: "Sort by risk",
                cssClass: classes.regCol,
                sortType: 'risk'
            },
            {
                label: 'Ques',
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
        ];

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

        list.forEach((item) => {
            if (riskSet.hasOwnProperty(item.ID)){
                item.risk = riskSet[item.ID];
                item.completion = 100 * (Object.keys(responses[item.ID]).length / questions.length);
                item.age = 0;
                item.action = (Object.keys(responses[item.ID]).length === 0 ? "Start" : "Edit");
            }
        });

        list.sort((a, b) => {
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

        const rows = list.map((row, i) => (
            <TableRow key={i}>
                <TableCell key={i} className={classes.cell}>
                    {row.Name}
                </TableCell>
                <TableCell className={classes.cell}>
                    {(() => {
                        if (riskSet.hasOwnProperty(row.ID)) return riskSet[row.ID];
                        else return "N/A";
                    })()}
                </TableCell>
                <TableCell className={classes.cell}>
                    {(() => {
                        if (riskSet.hasOwnProperty(row.ID)) {
                            if (riskSet[row.ID] < 0.25){
                                return "*";
                            } else if (riskSet[row.ID] < 0.5){
                                return "**";
                            } else if (riskSet[row.ID] < 0.75){
                                return "***";
                            } else {
                                return "****";
                            }
                        }
                        else return "N/A";
                    })()}
                </TableCell>
                <TableCell className={classes.cell}>
                    {(() => {
                        return 100 * (Object.keys(responses[row.ID]).length / questions.length);
                    })()}%
                </TableCell>
                <TableCell className={classes.cell}>
                    <em>age calc</em>
                </TableCell>
                <TableCell className={classes.cell}>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      className={classes.button}
                      onClick={(e) => this.handleItemSelection(e, row)}
                    >
                        {(() => {
                            if (Object.keys(responses[row.ID]).length === 0){
                                return "Start...";
                            } else {
                                return "Edit...";
                            }
                        })()}
                    </Button>
                </TableCell>
            </TableRow>
        ));

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
                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    open={true}
                    ContentProps={{
                        'aria-describedby': 'message-id',
                    }}
                    message={<span id="message-id">Current {type} risk: {riskVal}</span>}
                />
            </div>
        );
    }
}

export default withStyles(styles)(connect(mapState)(ItemList));