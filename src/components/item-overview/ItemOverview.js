import React, { Component } from 'react';

import store from '../../redux/store';
import { updateCurrentItemId } from "../../redux/actions";
import { connect } from "react-redux";

import { Link as RouterLink } from 'react-router-dom';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

const mapState = state => ({
    currentType: state.currentType,
    suppliers: state.suppliers,
    products: state.products,
    projects: state.projects
});

class ItemOverview extends Component {
    constructor(props){
        super(props);
        // Clear current item id when loaded
        store.dispatch(updateCurrentItemId({currentItemId: null}));
    }

    handleItemSelection = (event, itemId) => {
        store.dispatch(updateCurrentItemId({currentItemId: itemId}));
    }

    render() {
        //console.log("props: ", this.props);
        let type = null;
        if (this.props.currentType == null){
            return <div className={"item-overview"}>Current type is null in the current session.</div>;
        }

        type = this.props.currentType;

        // This would be used if getting to this component not with the router.
        /*if (this.props.type == null){
            return <div className={"item-overview"}>Attribute type needs to have a value provided, like type="suppliers"</div>;
        }*/

        let list = null;
        if (type === "suppliers"){
            list = this.props.suppliers;
        } else if (type === "products"){
            list = this.props.products;
        } else if (type === "projects"){
            list = this.props.projects;
        }

        const url= '/question-list';

        const rows = list.map((row, i) => (
            <TableRow key={i}>
                <TableCell key={i}>
                    <RouterLink
                      to={{pathname: url}}
                      onClick={(e) => this.handleItemSelection(e, row.ID)}
                    >
                        {row.Name}
                    </RouterLink>
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

export default connect(mapState)(ItemOverview);