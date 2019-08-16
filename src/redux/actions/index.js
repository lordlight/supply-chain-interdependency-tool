// Action types
export const ADD_SUPPLIERS = "ADD_SUPPLIERS";
export const ADD_PRODUCTS = "ADD_PRODUCTS";
export const ADD_PROJECTS = "ADD_PROJECTS";
export const ANSWER_TEMP = "ANSWER_TEMP";
export const ANSWER_MULTI = "ANSWER_MULTI";
export const INIT_SESSION = "INIT_SESSION";
export const INIT_PREFERENCES = "INIT_PREFERENCES";
export const UPDATE_PREFERENCES = "UPDATE_PREFERENCES";
export const UPDATE_CURRENT_TYPE = "UPDATE_CURRENT_TYPE";
export const UPDATE_CURRENT_ITEM = "UPDATE_CURRENT_ITEM";
export const UPDATE_IMPORT_FILE = "UPDATE_IMPORT_FILE";
export const UPDATE_IMPORT_STATE = "UPDATE_IMPORT_STATE";
export const UPDATE_NAV_STATE = "UPDATE_NAV_STATE";
export const UPDATE_TEMP_RESPONSES = "UPDATE_TEMP_RESPONSES";
export const UPDATE_TYPE_RISK = "UPDATE_TYPE_RISK";
export const UPDATE_SCORES = "UPDATE_SCORES";
export const RESET = "RESET";
export const SET_SELECTED_RESOURCE = "SET_SELECTED_RESOURCE";

// Action creators
export function addSuppliers(payload) {
  return { type: ADD_SUPPLIERS, payload };
}

export function addProducts(payload) {
  return { type: ADD_PRODUCTS, payload };
}

export function addProjects(payload) {
  return { type: ADD_PROJECTS, payload };
}

export function answerMulti(payload) {
  return { type: ANSWER_MULTI, payload };
}

export function answerTemp(payload) {
  return { type: ANSWER_TEMP, payload };
}

export function initSession(payload) {
  return { type: INIT_SESSION, payload };
}

export function initPreferences(payload) {
  return { type: INIT_PREFERENCES, payload };
}

export function updatePreferences(payload) {
  return { type: UPDATE_PREFERENCES, payload };
}

export function updateCurrentType(payload) {
  return { type: UPDATE_CURRENT_TYPE, payload };
}

export function updateCurrentItem(payload) {
  return { type: UPDATE_CURRENT_ITEM, payload };
}

export function updateImportFile(payload) {
  return { type: UPDATE_IMPORT_FILE, payload };
}

export function updateImportState(payload) {
  return { type: UPDATE_IMPORT_STATE, payload };
}

export function updateNavState(payload) {
  return { type: UPDATE_NAV_STATE, payload };
}

export function updateTempResponses(payload) {
  return { type: UPDATE_TEMP_RESPONSES, payload };
}

export function updateTypeRisk(payload) {
  return { type: UPDATE_TYPE_RISK, payload };
}

export function updateScores(payload) {
  return { type: UPDATE_SCORES, payload };
}

export function reset() {
  return { type: RESET };
}

export function setSelectedResource(payload) {
  return {
    type: SET_SELECTED_RESOURCE,
    payload
  };
}
