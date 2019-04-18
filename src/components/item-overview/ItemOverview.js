import React, { Component } from 'react';

import { ItemList, QuestionList } from '../../components';

import store from '../../redux/store';
import { updateCurrentItemId } from "../../redux/actions";
import { connect } from "react-redux";

const mapState = state => ({
    currentType: state.currentType,
    currentItemId: state.currentItemId,
    suppliers: state.suppliers,
    products: state.products,
    projects: state.projects
});

class ItemOverview extends Component {
    constructor(props){
        super(props);
        // Clear current type on home
        store.dispatch(updateCurrentItemId({currentItemId: null}));
    }

    render() {
        if (this.props.currentType == null){
            return <div className={"item-overview"}>Current type is null in the current session.</div>;
        }

        if (this.props.currentItemId != null){
            return <QuestionList />;
        }

        return <ItemList />;
    }
}

export default connect(mapState)(ItemOverview);