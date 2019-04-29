// Action types
export const ADD_SUPPLIERS = "ADD_SUPPLIERS";
export const ADD_PRODUCTS = "ADD_PRODUCTS";
export const ADD_PROJECTS = "ADD_PROJECTS";
export const ANSWER_QUESTION = "ANSWER_QUESTION";
export const INIT_SESSION = "INIT_SESSION";
export const UPDATE_CURRENT_TYPE = "UPDATE_CURRENT_TYPE";
export const UPDATE_CURRENT_ITEM = "UPDATE_CURRENT_ITEM";
export const UPDATE_IMPORT_FILE = "UPDATE_IMPORT_FILE";
export const UPDATE_NAV_STATE = "UPDATE_NAV_STATE";
export const UPDATE_TYPE_RISK = "UPDATE_TYPE_RISK";

// Action creators
export function addSuppliers(payload) {
    return { type: ADD_SUPPLIERS, payload }
};

export function addProducts(payload) {
    return { type: ADD_PRODUCTS, payload }
};

export function addProjects(payload) {
    return { type: ADD_PROJECTS, payload }
};

export function initSession(payload){
    return {type: INIT_SESSION, payload }
}

export function answerQuestion(payload){
    return {type: ANSWER_QUESTION, payload }
}

export function updateCurrentType(payload){
    return {type: UPDATE_CURRENT_TYPE, payload }
}

export function updateCurrentItem(payload){
    return {type: UPDATE_CURRENT_ITEM, payload }
}

export function updateImportFile(payload){
    return {type: UPDATE_IMPORT_FILE, payload}
}

export function updateNavState(payload){
    return {type: UPDATE_NAV_STATE, payload }
}

export function updateTypeRisk(payload){
    return {type: UPDATE_TYPE_RISK, payload }
}