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
  return (val || "").split(";").filter(v => !!v);
}

export function getNumQuestionsForResource(item, questions) {
  return questions
    .map(q => {
      if (q.Relation) {
        const rids = (item[q.Relation] || "").split(";").filter(i => !!i);
        return rids.length;
      } else {
        return 1;
      }
    })
    .reduce((total, cnt) => total + cnt);
}

export function getLatestResponseForResource(responses) {
  const timestamps = Object.values(responses)
    .map(r => getQuestionResponseTimestamp(r))
    .filter(val => !!val);
  return Math.max(...timestamps);
}

export class ResourcesDesignators {
  constructor(preferences) {
    this.designators = (preferences || {})["resources.designators"] || {};
  }

  get = resource => {
    return this.designators[resource] || resource;
  };

  getPlural = resource => {
    return (
      this.designators[resource + "s"] ||
      (this.designators[resource] || resource) + "s"
    );
  };
}

export const AVAILABLE_COLORSCHEMES = {
  "Brown-White-Green (colorblind-safe)": ["#5AB4AC", "#F5F5F5", "#D8B365"],
  "Pink-White-Green (colorblind-safe)": ["#A1D76A", "#F7F7F7", "#E9A3C9"],
  "Purple-White-Green (colorblind-safe)": ["#7FBF7B", "#F7F7F7", "#AF8DC3"],
  "Purple-Grey-Orange (colorblind-safe)": ["#F1A340", "#F7F7F7", "#998EC3"],
  "Red-White-Blue (colorblind-safe)": ["#67A9CF", "#F7F7F7", "#EF8A62"],
  "Red-Yellow-Blue (colorblind-safe)": ["#91BFDB", "#FFFFBF", "#FC8D59"]
};
export const DEFAULT_COLORSCHEME = "Brown-White-Green (colorblind-safe)";

export function getColorScheme(preferences) {
  const colorscheme =
    AVAILABLE_COLORSCHEMES[
      (preferences || {})["viz.colorscheme"] || DEFAULT_COLORSCHEME
    ] || AVAILABLE_COLORSCHEMES[DEFAULT_COLORSCHEME];
  return colorscheme;
}
