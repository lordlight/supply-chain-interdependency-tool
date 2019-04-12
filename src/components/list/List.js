import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';

import { connect } from "react-redux";

const listStyles = theme => ({
    root: {
        width: '100%',
        marginTop: theme.spacing.unit * 3,
        overflowX: 'auto',
    },
    table: {
        minWidth: 700,
    },
});

const mapState = state => ({
    suppliers: state.suppliers,
    products: state.products,
    projects: state.projects
});

class List extends Component {
    constructor(props){
        super(props);
    }

    render() {
        let list = null;
        if (this.props.type === "suppliers"){
            list = this.props.suppliers;
        } else if (this.props.type === "products"){
            list = this.props.products;
        } else if (this.props.type === "projects"){
            list = this.props.projects;
        }

        if (list < 1){
            return null;
        }

        const labels = Object.keys(list[0]).map((label, i) => (
            <TableCell key={"label-" + i}
            align={(() => {
                if (i > 0) return "right";
                else return "left";
            })()}
            >
                {label}
            </TableCell>
        ));

        const rows = list.map((row, i) => (
            <TableRow key={i}>
                {Object.keys(row).map((prop, j) => (
                    <TableCell
                      key={i + "-" + j}
                      align={(() => {
                        if (j > 0) return "right";
                        else return "left";
                      })()}
                    >
                        <TextField 
                            inputProps={{style: {textAlign: "right"}}}
                            defaultValue={row[prop]}
                        >
                        </TextField>
                    </TableCell>
                ))}
            </TableRow>
        ));

        return (
            <Table className={this.props.table}>
                <TableHead>
                    <TableRow>
                        {labels}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows}
                </TableBody>
            </Table>
        );
    }
}

export default withStyles(listStyles)(connect(mapState)(List));
