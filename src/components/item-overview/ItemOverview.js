import React, { Component } from 'react';
import { connect } from "react-redux";

import { QuestionList } from "../../components/";

const mapState = state => ({
    suppliers: state.suppliers,
    products: state.products,
    projects: state.projects
});

class ItemOverview extends Component {
    constructor(props){
        super(props);
    }

    render() {
        if (this.props.type == null){
            return <div className={"item-overview"}>Attribute type needs to have a value provided, like type="suppliers"</div>;
        }

        return (
            <QuestionList type={this.props.type} />
        );
    }
}

export default ItemOverview;