import { getQuestionResponse, getCellMultiples } from "./question-responses";

// store here as constant for now, may want to put in data
const NORMALIZED_VALUES = {
  suppliers_score: 100,
  products_score: 100,
  suppliers_criticality: 1,
  products_criticality: 1,
  projects_criticality: 10
};

export function calculateItemRisk(
  resourceType,
  responses,
  questions,
  resources
) {
  let perItemRisk = {};
  const resourcesMap = {};
  resources.forEach(r => (resourcesMap[r.ID] = r));

  // For each item (supplier, product, project) with responses
  Object.entries(responses).forEach(responseEntry => {
    let itemId = responseEntry[0];
    let itemResponses = responseEntry[1];

    // score, criticality is dictionary keyed by related resource type & id
    perItemRisk[itemId] = { score: 0, criticality: {} };

    questions.forEach(question => {
      const qtype = question["Type of question"];
      const qrelation = question.Relation;
      if (qtype === "criticality") {
        if (qrelation) {
          // criticality applies to a specific resource
          const [qrtype, qkey] = getCellMultiples(qrelation);
          const shadowIds = question[qkey];
          let qvals;
          let ckeyPrefix;
          if (shadowIds) {
            qvals = getCellMultiples(shadowIds);
            ckeyPrefix = `${qrtype}.shadow`;
          } else {
            qvals = getCellMultiples((resourcesMap[itemId] || {})[qkey] || "");
            ckeyPrefix = qrtype;
          }
          qvals.forEach(qval => {
            const ckey = `${ckeyPrefix}|${qval}`; // for key need type and id, concatenate
            const qid = `${question.ID}|${qval}`; // key into answers
            if (itemResponses.hasOwnProperty(qid)) {
              const ansInd = Math.max(
                parseInt(getQuestionResponse(itemResponses[qid])),
                0
              );
              perItemRisk[itemId].criticality[ckey] =
                (perItemRisk[itemId].criticality[ckey] || 0) +
                question.Answers[ansInd].val;
            } else {
              perItemRisk[itemId].criticality[ckey] =
                (perItemRisk[itemId].criticality[ckey] || 0) +
                Math.max.apply(
                  Math,
                  question.Answers.map(ans => {
                    return ans.val;
                  })
                );
              //   console.log(
              //     ">>>>",
              //     resourceType,
              //     itemId,
              //     ckey,
              //     qid,
              //     getQuestionResponse(itemResponses[qid]),
              //     perItemRisk[itemId].criticality[ckey]
              //   );
            }
          });
        } else {
          // TODO: need "Relation" to be defined for criticality, otherwise skip; report error in some way?
        }
      } else {
        // score question
        if (itemResponses.hasOwnProperty(question.ID)) {
          const ansInd = Math.max(
            parseInt(getQuestionResponse(itemResponses[question.ID])),
            0
          );
          perItemRisk[itemId].score =
            (perItemRisk[itemId].score || 0) + question.Answers[ansInd].val;
        } else {
          perItemRisk[itemId].score =
            (perItemRisk[itemId].score || 0) +
            Math.max.apply(
              Math,
              question.Answers.map(ans => {
                return ans.val;
              })
            );
        }
      }
    });
    // normalize score
    const nval = NORMALIZED_VALUES[`${resourceType}_score`];
    perItemRisk[itemId].score =
      (perItemRisk[itemId].score / getMaxScore(questions)) * nval;
    // normalize criticalities
    Object.keys(perItemRisk[itemId].criticality || {}).forEach(qkey => {
      const [qrKey, qrId] = qkey.split("|");
      const [qrType, qrModifier] = qrKey.split(".");
      const nval = NORMALIZED_VALUES[`${resourceType}_criticality`];
      const maxCriticality =
        qrModifier === "shadow"
          ? getMaxShadowCriticality(questions, qrType, qrId)
          : getMaxCriticality(questions, qrType);
      perItemRisk[itemId].criticality[qkey] =
        (perItemRisk[itemId].criticality[qkey] / maxCriticality) * nval;
    });
  });
  console.log("per item risk: ", perItemRisk);
  return perItemRisk;
}

function getMaxScore(questions) {
  let maxRisk = 0;
  questions
    .filter(q => q["Type of question"] === "score")
    .forEach(question => {
      maxRisk += Math.max.apply(
        Math,
        question.Answers.map(ans => {
          return ans.val;
        })
      );
    });

  return maxRisk;
}

// Get maximum possible criticality risk score for an item, given a resource type
// the criticality applies to.
// if no resource type, applies globally to item
function getMaxCriticality(questions, resourceType) {
  let maxRisk = 0;
  questions
    .filter(q => {
      const [rtype, _] = (q.Relation || "").split(";");
      return q["Type of question"] === "criticality" && rtype === resourceType;
    })
    .forEach(question => {
      maxRisk += Math.max.apply(
        Math,
        question.Answers.map(ans => {
          return ans.val;
        })
      );
    });
  return maxRisk;
}

// Get maximum possible criticality risk score for a shadow resource
function getMaxShadowCriticality(questions, resourceType, resourceId) {
  let maxRisk = 0;
  questions
    .filter(q => {
      const [rtype, rkey] = (q.Relation || "").split(";");
      // resource id must match one of the shadow ids on question
      const resourceMatch =
        (q[rkey] || "").split(";").indexOf(resourceId) !== -1;
      return (
        q["Type of question"] === "criticality" &&
        rtype === resourceType &&
        resourceMatch
      );
    })
    .forEach(question => {
      maxRisk += Math.max.apply(
        Math,
        question.Answers.map(ans => {
          return ans.val;
        })
      );
    });
  return maxRisk;
}
