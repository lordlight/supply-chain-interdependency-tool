import { ADD_SUPPLIERS, ADD_PRODUCTS, ADD_PROJECTS, ANSWER_MULTI, ANSWER_TEMP,
    INIT_SESSION, UPDATE_CURRENT_TYPE, UPDATE_CURRENT_ITEM, UPDATE_IMPORT_FILE,
    UPDATE_IMPORT_STATE, UPDATE_NAV_STATE, UPDATE_TEMP_RESPONSES, UPDATE_TYPE_RISK } from "../actions";

const initialState = {
    currentType: null,
    currentItem: null,
    importFile: null,
    importState: null,
    navState: "home",
    suppliers: [],
    suppliersInactive: [],
    products: [],
    productsInactive: [],
    projects: [],
    projectsInactive: [],
    suppliersRisk: {},
    productsRisk: {},
    projectsRisk: {},
    supplierQuestions: [],
    productQuestions: [],
    projectQuestions: [],
    supplierResponses: {},
	productResponses: {},
    projectResponses: {},
    tempResponses: {}
};

const _ensureResponses = (resources, responses) => {
    responses = {...responses};
    resources.forEach(r => {
        if (!responses[r.ID]) {
            responses[r.ID] = {};
        }
    });
    return responses;
}

const _constructProjectHierarchy = projects => {
    const level2project = {};
    projects = projects.map(p => { return {...p, parent: null, children: []}})
	projects.forEach(p => {
		const level = p.Level;
		if (level) {
			level2project[level] = p;
		}
    });
	projects.forEach(p => {
        const level = p.Level;
		if (level) {
            let child = level2project[p.Level];
			let parentLvl = level.split(".");
			parentLvl.pop();
			parentLvl = parentLvl.join(".");
			if (parentLvl) {
				const parent = level2project[parentLvl];
				if (parent) {
                    child.parent = parent;
                    parent.children.push(child);
				}
            }
		}
    });
    return projects;
}

function rootReducer(state = initialState, action) {
    if (action.type === ADD_SUPPLIERS){
        const suppliers = action.payload.filter(s => !!s._cscrm_active);
        const suppliersInactive = action.payload.filter(s => !s._cscrm_active);
        // add empty responses for new suppliers
        const supplierResponses = _ensureResponses(suppliers, state.supplierResponses);
        return Object.assign({}, state, {
            suppliers, suppliersInactive, supplierResponses
        });
    } else if (action.type === ADD_PRODUCTS){
        const products = action.payload.filter(p => !!p._cscrm_active);
        const productsInactive = action.payload.filter(p => !p._cscrm_active);
        // add empty responses for new products
        const productResponses = _ensureResponses(products, state.productResponses);
        return Object.assign({}, state, {
            products, productsInactive, productResponses
        });
    } else if (action.type === ADD_PROJECTS){
        let projects = action.payload.filter(p => !!p._cscrm_active);
        projects = _constructProjectHierarchy(projects);
        const organizations = projects.filter(p => !p.parent);
        projects = projects.filter(p => !!p.parent);
        const projectsInactive = action.payload.filter(p => !p._cscrm_active);
        // add empty responses for new projects
        const projectResponses = _ensureResponses(projects, state.projectResponses);
        return Object.assign({}, state, {
            projects, projectsInactive, organizations, projectResponses
        });
    } /*else if (action.type === ANSWER_QUESTION){
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
    } */
    else if (action.type === ANSWER_MULTI){
        let type = action.payload.type;
        if (type === "suppliers"){
            return {
                ...state,
                supplierResponses: {
                    ...state.supplierResponses,
                    [action.payload.itemId]: action.payload.responses
                }
            }
        } else if (type === "products"){
            return {
                ...state,
                productResponses: {
                    ...state.productResponses,
                    [action.payload.itemId]: action.payload.responses
                }
            }
        } else if (type === "projects") {
            return {
                ...state,
                projectResponses: {
                    ...state.projectResponses,
                    [action.payload.itemId]: action.payload.responses
                }
            }
        }
    } else if (action.type === ANSWER_TEMP){
        return {
            ...state,
            tempResponses: {
                ...state.tempResponses,
                [action.payload.qId]: action.payload.ansInd
            }
        }
    } else if (action.type === INIT_SESSION) {
        let projects = action.payload.projects.filter(p => !!p._cscrm_active);
        projects = _constructProjectHierarchy(projects);
        const organizations = projects.filter(p => !p.parent);
        projects = projects.filter(p => !!p.parent);
        const projectsInactive = action.payload.projects.filter(p => !p._cscrm_active);
        return Object.assign({}, state, {
            // suppliers: state.suppliers = action.payload.suppliers,
            suppliers: action.payload.suppliers.filter(s => !!s._cscrm_active),
            suppliersInactive: action.payload.suppliers.filter(s => !s._cscrm_active),
            products: action.payload.products.filter(p => !!p._cscrm_active),
            productsInactive: action.payload.products.filter(p => !p._cscrm_active),
            projects,
            projectsInactive,
            organizations,
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
    } else if (action.type === UPDATE_IMPORT_STATE){
        return Object.assign({}, state, {
            importState: state.importState = action.payload.importState
        });
    } else if (action.type === UPDATE_NAV_STATE){
        return Object.assign({}, state, {
            navState: state.navState = action.payload.navState
        });
    } else if (action.type === UPDATE_TEMP_RESPONSES){
        return Object.assign({}, state, {
            tempResponses: state.tempResponses = action.payload.tempResponses
        });
    } else if (action.type === UPDATE_TYPE_RISK){
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