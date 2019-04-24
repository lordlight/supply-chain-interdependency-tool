import React, { Component } from 'react';

import { ItemList, QuestionList } from '../../components';

import store from '../../redux/store';
import { updateCurrentItem } from "../../redux/actions";
import { connect } from "react-redux";

const mapState = state => ({
    currentType: state.currentType,
    currentItem: state.currentItem,
    suppliers: state.suppliers,
    products: state.products,
    projects: state.projects
});

class ItemOverview extends Component {
    constructor(props){
        super(props);
        // Clear current type on home
        store.dispatch(updateCurrentItem({currentItem: null}));
    }

    render() {
        if (this.props.currentType == null){
            return <div className={"item-overview"}>Current type is null in the current session.</div>;
        }

        if (this.props.currentItem != null){
            return <QuestionList />;
        }

        return <ItemList />;
    }
}

export default connect(mapState)(ItemOverview);