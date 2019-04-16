import { ADD_SUPPLIERS, ADD_PRODUCTS, ADD_PROJECTS, INIT_SESSION } from "../actions";

const initialState = {
    suppliers: [],
    products: [],
    projects: [],
    supplierQuestions: [],
    productQuestions: [],
    projectQuestions: [],
    supplierResponses: {},
	productResponses: {},
	projectResponses: {}
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
    } else if (action.type === INIT_SESSION){
        return Object.assign({}, state, {
            suppliers: state.suppliers = action.payload.suppliers,
            products: state.products = action.payload.products,
            projects: state.projects = action.payload.projects,
            supplierQuestions: state.supplierQuestions = action.payload.supplierQuestions,
            productQuestions: state.productQuestions = action.payload.productQuestions,
            projectQuestions: state.projectQuestions = action.payload.projectQuestions,
            supplierResponses: state.supplierResponses = action.payload.supplierResponses,
            productResponses: state.productResponses = action.payload.productResponses,
            projectResponses: state.projectResponses = action.payload.projectResponses
        });
    }
    return state;
};

export default rootReducer;