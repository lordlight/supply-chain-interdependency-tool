import { ADD_SUPPLIERS, ADD_PRODUCTS, ADD_PROJECTS, ANSWER_QUESTION, INIT_SESSION,
    UPDATE_CURRENT_TYPE, UPDATE_CURRENT_ITEMID } from "../actions";

const initialState = {
    currentType: null,
    currentItemId: null,
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
    } else if (action.type === ANSWER_QUESTION){
        let type = action.payload.type;
        if (type === "suppliers"){
            return {
                ...state,
                supplierResponses: {
                    ...state.supplierResponses,
                    [action.payload.itemId]: {
                        ...state.supplierResponses[action.payload.itemId],
                        [action.payload.queId]: action.payload.ansInd
                    }
                }
            }
        }
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
    } else if (action.type === UPDATE_CURRENT_ITEMID){
        return Object.assign({}, state, {
            currentItemId: state.currentItemId = action.payload.currentItemId
        });
    } else if (action.type === UPDATE_CURRENT_TYPE){
        return Object.assign({}, state, {
            currentType: state.currentType = action.payload.currentType
        });
    }
    return state;
};

export default rootReducer;