import React, { Component } from 'react';
import * as d3 from "d3";

class RiskGraph extends Component {
    constructor(props){
        super(props);
        this.drawChart = this.drawChart.bind(this);
    }

    componentDidMount(){
        console.log("did mount");
        this.drawChart();
    }

    drawChart(){
        console.log("draw chart");
        const w = 300, h = 300;
        const data = [12, 5, 6, 6, 9, 10];
        const svg = d3.select("body")
                     .append("svg")
                     .attr("width", w)
                     .attr("height", h)
                     .style("margin-left", 100);
        
        svg.selectAll("rect")
           .data(data)
           .enter()
           .append("rect")
           .attr("x", (d, i) => i * 70)
           .attr("y", (d, i) => h - 10 * d)
           .attr("width", 65)
           .attr("height", (d, i) => d * 10)
           .attr("fill", "green")
    }

    render() {
        return <div id={"risk-graph"}></div>;
    }
}

export default RiskGraph;