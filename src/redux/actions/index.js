// Action types
export const ADD_SUPPLIERS = "ADD_SUPPLIERS";
export const ADD_PRODUCTS = "ADD_PRODUCTS";
export const ADD_PROJECTS = "ADD_PROJECTS";
export const INIT_SESSION = "INIT_SESSION";
export const ANSWER_QUESTION = "ANSWER_QUESTION";
export const UPDATE_CURRENT_TYPE = "UPDATE_CURRENT_TYPE";
export const UPDATE_CURRENT_ITEMID = "UPDATE_CURRENT_ITEMID";

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

export function updateCurrentItemId(payload){
    return {type: UPDATE_CURRENT_ITEMID, payload }
}