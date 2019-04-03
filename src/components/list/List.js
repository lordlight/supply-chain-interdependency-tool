import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';

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
        let id = 0;
        const data = {
            "labels": ["Dessert", "Calories", "Fat (g)", "Carbs (g)", "Protein (g)"],
            "rows": [
                ['Frozen yoghurt', 159, 6.0, 24, 4.0],
                ['Ice cream sandwich', 237, 9.0, 37, 4.3],
                ['Eclair', 262, 16.0, 24, 6.0],
                ['Cupcake', 305, 3.7, 67, 4.3],
                ['Gingerbread', 356, 16.0, 49, 3.9]
            ]
        };

        return (
            <Table className={this.props.table}>
                <TableHead>
                    <TableRow>
                        {data.labels.map((label, index) => (
                           <TableCell
                             align={(() => {
                                if (index > 0) return "right";
                                else return "left";
                             })()}
                             >{label}</TableCell> 
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.rows.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell component="th" scope="row">
                                {row[0]}
                            </TableCell>
                            <TableCell align="right">
                                <TextField
                                    inputProps={{style: {textAlign: "right"}}}
                                    defaultValue={row[1]}
                                >
                                </TextField>
                            </TableCell>
                            <TableCell align="right">
                                <TextField
                                    inputProps={{style: {textAlign: "right"}}}
                                    defaultValue={row[2]}
                                >
                                </TextField>
                            </TableCell>
                            <TableCell align="right">
                                <TextField
                                    inputProps={{style: {textAlign: "right"}}}
                                    defaultValue={row[3]}
                                >
                                </TextField>
                            </TableCell>
                            <TableCell align="right">
                                <TextField
                                    inputProps={{style: {textAlign: "right"}}}
                                    defaultValue={row[4]}
                                >
                                </TextField>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }
}

export default withStyles(listStyles)(List);
