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
      
    createData(id, name, calories, fat, carbs, protein) {
        id += 1;
        console.log("id: ", id);
        return { id, name, calories, fat, carbs, protein };
    }

    render() {
        if (this.props.projects.length < 1){
            return null;
        }

        const labels = Object.keys(this.props.projects[0]).map((label, i) => (
            <TableCell key={"label-" + i}
            align={(() => {
                if (i > 0) return "right";
                else return "left";
            })()}
            >
                {label}
            </TableCell>
        ));

        const rows = this.props.projects.map((row, i) => (
            <TableRow key={i}>
                {Object.keys(row).map((prop, j) => (
                    <TableCell key={i + "-" + j}>
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
