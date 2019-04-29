import { ADD_SUPPLIERS, ADD_PRODUCTS, ADD_PROJECTS, ANSWER_QUESTION, INIT_SESSION, UPDATE_CURRENT_TYPE,
    UPDATE_CURRENT_ITEM, UPDATE_IMPORT_FILE, UPDATE_NAV_STATE, UPDATE_TYPE_RISK } from "../actions";

const initialState = {
    currentType: null,
    currentItem: null,
    importFile: null,
    navState: "home",
    suppliers: [],
    products: [],
    projects: [],
    suppliersRisk: {},
    productsRisk: {},
    projectsRisk: {},
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
        } else if (type === "products"){
            return {
                ...state,
                productResponses: {
                    ...state.productResponses,
                    [action.payload.itemId]: {
                        ...state.productResponses[action.payload.itemId],
                        [action.payload.queId]: action.payload.ansInd
                    }
                }
            }
        } else if (type === "projects") {
            return {
                ...state,
                projectResponses: {
                    ...state.projectResponses,
                    [action.payload.itemId]: {
                        ...state.projectResponses[action.payload.itemId],
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
    } else if (action.type === UPDATE_CURRENT_ITEM){
        return Object.assign({}, state, {
            currentItem: state.currentItem = action.payload.currentItem
        });
    } else if (action.type === UPDATE_CURRENT_TYPE){
        return Object.assign({}, state, {
            currentType: state.currentType = action.payload.currentType
        });
    } else if (action.type === UPDATE_IMPORT_FILE){
        return Object.assign({}, state, {
            importFile: state.importFile = action.payload.importFile
        });
    } else if (action.type === UPDATE_NAV_STATE){
        return Object.assign({}, state, {
            navState: state.navState = action.payload.navState
        });
    } else if (action.type === UPDATE_TYPE_RISK){
        //console.log("RISK UPDATE: ", action.payload);
        let type = action.payload.type;
        if (type === "suppliers"){
            return Object.assign({}, state, {
                suppliersRisk: action.payload.itemsRisk
            });
        } else if (type === "products"){
            return Object.assign({}, state, {
                productsRisk: action.payload.itemsRisk
            });
        } else if (type === "projects"){
            return Object.assign({}, state, {
                projectsRisk: action.payload.itemsRisk
            });
        }
    }
    return state;
};

export default rootReducer;