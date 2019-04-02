import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { Typography } from "@material-ui/core";

class Home extends Component {
  render() {
    return (
        <div>
            <Typography variant="title"
                color="inherit"
                style={{ flexGrow: 1, textDecoration: "none" }}
                component={Link}
                to="/assessment">
                    Assessment
            </Typography>
            <Typography variant="title"
                color="inherit"
                style={{ flexGrow: 1, textDecoration: "none" }}
                component={Link}
                to="/risk-visual">
                    Risk Visual
            </Typography>
        </div>
    );
  }
}

export default Home;