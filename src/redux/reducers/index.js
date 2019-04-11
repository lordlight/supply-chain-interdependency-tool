import { ADD_SUPPLIERS, ADD_PRODUCTS, ADD_PROJECTS } from "../actions";

const initialState = {
    suppliers: [],
    products: [],
    projects: []
};

function rootReducer(state = initialState, action) {
    if (action.type === ADD_SUPPLIERS){
        return Object.assign({}, state, {
            suppliers: state.suppliers = action.payload
        });
    } else if (action.type === ADD_PRODUCTS){
        return Object.assign({}, state, {
            products: state.products = action.payload
        });
    } else if (action.type === ADD_PROJECTS){
        return Object.assign({}, state, {
            projects: state.projects = action.payload
        });
    }
    return state;
};

export default rootReducer;