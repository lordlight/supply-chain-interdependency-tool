import React, { Component } from 'react';

import store from '../../redux/store';
import { updateCurrentItem } from "../../redux/actions";
import { connect } from "react-redux";

import { calculateTypeRiskFromItemsRisk } from '../../utils/risk-calculations';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import Link from '@material-ui/core/Link';

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
    overview: {
        display: 'inline-flex',
    },
    table: {

    },
    titleCol: {
        textTransform: 'uppercase',
    },
    regCol: {
        textTransform: 'capitalize',
    },
    button: {
        textTransform: 'uppercase',
        width: 72,
        height: 27,
    },
});

class ItemList extends Component {
    handleItemSelection = (event, item) => {
        store.dispatch(updateCurrentItem({currentItem: item}));
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
            list = this.props.suppliers;
            riskVal = calculateTypeRiskFromItemsRisk(this.props.suppliersRisk);
            riskSet = this.props.suppliersRisk;
            questions = this.props.supplierQuestions;
            responses = this.props.supplierResponses;
        } else if (type === "products"){
            list = this.props.products;
            riskVal = calculateTypeRiskFromItemsRisk(this.props.productsRisk);
            riskSet = this.props.productsRisk;
            questions = this.props.productQuestions;
            responses = this.props.productResponses;
        } else if (type === "projects"){
            list = this.props.projects;
            riskVal = calculateTypeRiskFromItemsRisk(this.props.projectsRisk);
            riskSet = this.props.projectsRisk;
            questions = this.props.projectQuestions;
            responses = this.props.projectResponses;
        }

        const rows = list.map((row, i) => (
            <TableRow key={i}>
                <TableCell key={i}>
                    {row.Name}
                </TableCell>
                <TableCell>
                    {(() => {
                        if (riskSet.hasOwnProperty(row.ID)) return riskSet[row.ID];
                        else return "N/A";
                    })()}
                </TableCell>
                <TableCell>
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
                <TableCell>
                    {(() => {
                        return 100 * (Object.keys(responses[row.ID]).length / questions.length);
                    })()}%
                </TableCell>
                <TableCell>
                    <em>age calc</em>
                </TableCell>
                <TableCell>
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
            <div>
                <div className={classes.overview}>
                    
                </div>
                <Table className={classes.table}>
                    <TableHead>
                        <TableRow>
                            <TableCell className={classes.titleCol}>
                                {type.substring(0, type.length - 1)}
                            </TableCell>
                            <TableCell className={classes.regCol}>
                                Risk
                            </TableCell>
                            <TableCell className={classes.regCol}>
                                Risk
                            </TableCell>
                            <TableCell className={classes.regCol}>
                                Ques
                            </TableCell>
                            <TableCell className={classes.regCol}>
                                Question Age
                            </TableCell>
                            <TableCell className={classes.regCol}>
                                Action
                            </TableCell>
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