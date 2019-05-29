import React, { Component } from 'react';
import { Typography, Tooltip } from '@material-ui/core';

import { connect } from "react-redux";

import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    cell: {
        display:"table-cell",
        width: 48,
        height: 48,
        backgroundColor: "white",
        borderWidth: 1,
        borderStyle: "solid",
        boxSizing: "border-box",
        borderColor: "rgba(0, 0, 0, 0.33)"
    }
});

const mapState = state => ({
    products: state.products,
    productsRisk: state.productsRisk
});

class ProductsChart extends Component {

    getCellColor = (row, col, buckets, numProducts) => {
        const alpha = 0.9 * buckets[row][col] / numProducts + 0.05;
        console.log("DDD", alpha);
        return `rgba(255, 0, 0, ${alpha})`;
    }

    getCellTooltip = (row, col, buckets) => {
        return `${buckets[row][col]} Products`
    }

    render = () => {

        const buckets = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ]

        Object.values(this.props.productsRisk).forEach(risk => {
            const impact = Math.max(risk.impact || 100, 0);
            const col = Math.min(Math.floor(impact * 0.03), 2);
            const criticality = Math.max(...Object.values(risk.criticality), 0);
            const row = Math.min(Math.floor(criticality * 3.0), 2);
            buckets[row][col]++;
        });
        const numProducts = (this.props.products || []).length;

        const { classes } = this.props;

        return <div style={{backgroundColor: "#dcdcdc", height:194}}>
            <div style={{display:"table", marginTop: 25, marginBottom: 0, marginLeft: "auto", marginRight: "auto"}}>
                <div style={{display:"table-row"}}>
                    <div style={{display:"table-cell", height: 48}}>
                        <Typography style={{transform: "rotate(-90deg) translate(-13px, 4px)", fontSize: 12}}>High</Typography>
                    </div>
                    {[0, 1, 2].map(col => <Tooltip title={this.getCellTooltip(2, col, buckets)}>
                        <div className={classes.cell} style={{backgroundColor: this.getCellColor(2, col, buckets, numProducts)}}></div>
                    </Tooltip>)}
                </div>
                <div style={{display:"table-row"}}>
                    <div style={{display:"table-cell", width: 6, height:48}}>
                        <Typography style={{width: 6, transform: "rotate(-90deg) translate(-48px, 4px)"}}>CRITICALITY</Typography>
                    </div>
                    {[0, 1, 2].map(col => <Tooltip title={this.getCellTooltip(1, col, buckets)}>
                        <div className={classes.cell} style={{backgroundColor: this.getCellColor(1, col, buckets, numProducts)}}></div>
                    </Tooltip>)}
                </div>
                <div style={{display:"table-row"}}>
                    <div style={{display:"table-cell", height:48}}>
                        <Typography style={{transform: "rotate(-90deg) translate(-13px, 4px)", fontSize: 12}}>Low</Typography>
                    </div>
                    {[0, 1, 2].map(col => <Tooltip title={this.getCellTooltip(0, col, buckets)}>
                        <div className={classes.cell} style={{backgroundColor: this.getCellColor(0, col, buckets, numProducts)}}></div>
                    </Tooltip>)}
                </div>
                <div style={{display:"table-row"}}>
                    <div style={{display:"table-cell", width: 6}}></div>
                    <div style={{display:"table-cell", width: 48}}>
                        <Typography style={{textAlign: "center", fontSize: 12}}>Low</Typography>
                    </div>
                    <div style={{display:"table-cell", width: 48}}>
                        <Typography style={{transform: "translate(0, 6px)", textAlign: "center", verticalAlign: "bottom"}}>IMPACT</Typography>
                    </div>
                    <div style={{display:"table-cell", width: 48}}>
                        <Typography style={{textAlign: "center", fontSize: 12}}>High</Typography>
                    </div>
                </div>
            </div>
        </div>
    }
}

export default withStyles(styles)(connect(mapState)(ProductsChart));
