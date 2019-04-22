import React, { Component } from 'react';

import store from '../../redux/store';
import { updateCurrentItemId } from "../../redux/actions";
import { connect } from "react-redux";

import { calculateTypeRiskFromItemsRisk } from '../../utils/risk-calculations';

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
    suppliersRisk: state.suppliersRisk,
    productsRisk: state.productsRisk,
    projectsRisk: state.projectsRisk
});

class ItemList extends Component {
    handleItemSelection = (event, itemId) => {
        store.dispatch(updateCurrentItemId({currentItemId: itemId}));
    }

    render() {
        if (this.props.currentType == null){
            return <div className={"item-list"}>Current type is null in the current session.</div>;
        }

        let type = this.props.currentType;

        let list = null;
        let riskVal = null;
        let riskSet = null;
        if (type === "suppliers"){
            list = this.props.suppliers;
            riskVal = calculateTypeRiskFromItemsRisk(this.props.suppliersRisk);
            riskSet = this.props.suppliersRisk;
        } else if (type === "products"){
            list = this.props.products;
            riskVal = calculateTypeRiskFromItemsRisk(this.props.productsRisk);
            riskSet = this.props.productsRisk;
        } else if (type === "projects"){
            list = this.props.projects;
            riskVal = calculateTypeRiskFromItemsRisk(this.props.projectsRisk);
            riskSet = this.props.projectsRisk;
        }

        const rows = list.map((row, i) => (
            <TableRow key={i}>
                <TableCell key={i}>
                    <Link onClick={(e) => this.handleItemSelection(e, row.ID)}>
                        {row.Name}{(() => {
                                    if (riskSet.hasOwnProperty(row.ID)) return " - risk value: "+riskSet[row.ID];
                                    else return "";
                                  })()}
                    </Link>
                </TableCell>
            </TableRow>
        ));

        return (
            <div>
                <Table className={this.props.table}>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                            {type} overview
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

export default connect(mapState)(ItemList);