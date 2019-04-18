import React, { Component } from 'react';

import store from '../../redux/store';
import { updateCurrentItemId } from "../../redux/actions";
import { connect } from "react-redux";

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
    projects: state.projects
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
        if (type === "suppliers"){
            list = this.props.suppliers;
        } else if (type === "products"){
            list = this.props.products;
        } else if (type === "projects"){
            list = this.props.projects;
        }

        const rows = list.map((row, i) => (
            <TableRow key={i}>
                <TableCell key={i}>
                    <Link onClick={(e) => this.handleItemSelection(e, row.ID)}>
                        {row.Name}
                    </Link>
                </TableCell>
            </TableRow>
        ));

        return (
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
        );
    }
}

export default connect(mapState)(ItemList);