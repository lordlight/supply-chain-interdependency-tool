// value is either (1) undefined/null, (2) a string representing an integer,
// (3) a tuple of string and timestamp, or (4) an array of such tuples
// (in order to track history)
export function getQuestionResponse(val) {
  return Array.isArray(val)
    ? Array.isArray(val[0])
      ? val[0][0]
      : val[0]
    : val;
}

export function getQuestionResponseTimestamp(val) {
  return Array.isArray(val)
    ? Array.isArray(val[0])
      ? val[0][1]
      : val[1]
    : null;
}

export function getCellMultiples(val) {
  return val.split(";").filter(v => !!v);
}
