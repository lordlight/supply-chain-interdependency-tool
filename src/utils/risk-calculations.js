// store here as constant for now, may want to put in data
const NORMALIZED_VALUES = {
    suppliers_impact: 100,
    products_impact: 100,
    products_criticality: 1,
    projects_criticality: 10
}

export function calculateItemRisk(resourceType, responses, questions, resources) {
    let perItemRisk = {};
    const resourcesMap = {};
    resources.forEach(r => resourcesMap[r.ID] = r);

    // For each item (supplier, product, project) with responses
    Object.entries(responses).forEach((responseEntry) => {
        let itemId = responseEntry[0];
        let itemResponses = responseEntry[1];

        // impact score, criticality is dictionary keyed by related resource type & id
        perItemRisk[itemId] = {impact: 0, criticality: {}};

        questions.forEach((question) => {
            // SJR will there be a separate weight, or is weight implicit?
            let questionVal = 1;
            if (question.hasOwnProperty("Weight")) {
                questionVal = Number(question.Weight);
            }
            const qtype = question["Type of question"];
            const qeach = question["Question for each"]
            if (qtype === "criticality") {
                if (qeach) {
                    // criticality applies to a specific resource
                    const [ qrtype, qkey ] = qeach.split(";");
                    // values are the ids of the resource criticality applies to
                    const qvals = ((resourcesMap[itemId] || {})[qkey] || "").split(";").filter(v => !!v);
                    // compute and score criticality by resource key
                    qvals.forEach(qval => {
                        const ckey = `${qrtype}|${qval}`; // for key need type and id, concatenat
                        const qid = `${question.ID}|${qval}`; // key into answers
                        if (itemResponses.hasOwnProperty(qid)) {
                            const ansInd = Math.max(parseInt(itemResponses[qid]), 0);
                            perItemRisk[itemId].criticality[ckey] = (perItemRisk[itemId].criticality[ckey] || 0) + questionVal * (question.Answers[ansInd].val);
                        } else {
                            perItemRisk[itemId].criticality[ckey] = (perItemRisk[itemId].criticality[ckey] || 0) + questionVal * Math.max.apply(Math, question.Answers.map(ans => { return ans.val}));
                        }
                    });
                } else {
                    // criticality applies to item overall - store as "default" key
                    if (itemResponses.hasOwnProperty(question.ID)){
                        const ansInd = Math.max(parseInt(itemResponses[question.ID]), 0);
                        perItemRisk[itemId].criticality.default = (perItemRisk[itemId].criticality.default || 0) + questionVal * (question.Answers[ansInd].val);
                    } else {
                        perItemRisk[itemId].criticality.default = (perItemRisk[itemId].criticality.default || 0) + questionVal * Math.max.apply(Math, question.Answers.map(ans => { return ans.val}));
                    }  
                }
            } else { // impact question
                if (itemResponses.hasOwnProperty(question.ID)){
                    const ansInd = Math.max(parseInt(itemResponses[question.ID]), 0);
                    //console.log("****answer given: ", questionVal * (question.Answers[ansInd].val));
                    // perItemRisk[itemId].impact += questionVal * (question.Answers[ansInd].val);
                    perItemRisk[itemId][qtype] = (perItemRisk[itemId][qtype] || 0) + questionVal * (question.Answers[ansInd].val);
                } else {
                    //console.log("no answer given: ",  Math.max.apply(Math, question.Answers.map(ans => { return ans.val})))
                    // perItemRisk[itemId].impact += questionVal * Math.max.apply(Math, question.Answers.map(ans => { return ans.val}));
                    perItemRisk[itemId][qtype] = (perItemRisk[itemId][qtype] || 0) + questionVal * Math.max.apply(Math, question.Answers.map(ans => { return ans.val}));
                }
            }
        });
        // normalize impact score
        const nval = NORMALIZED_VALUES[`${resourceType}_impact`];
        perItemRisk[itemId].impact = perItemRisk[itemId].impact / getMaxImpactRisk(questions) * nval;
        // normalize criticality score(s)
        Object.keys(perItemRisk[itemId].criticality || {}).forEach(qkey => {
            const qrType = qkey === "default" ? "" : qkey.split("|")[0];
            const nval = NORMALIZED_VALUES[`${resourceType}_criticality`];
            perItemRisk[itemId].criticality[qkey] = perItemRisk[itemId].criticality[qkey] / getMaxCriticalityRisk(questions, qrType) * nval;
        })
    });
    console.log("per item risk: ", perItemRisk);
    return perItemRisk;
}

// export function calculateTypeRiskFromItemsRisk(itemsRisk){
//     // Retun the sum of all the items' risks (defaulting to 0 if there are no items) divided by the total risk items.
//     if (Object.values(itemsRisk).length > 0) {
//         return Object.values(itemsRisk).map(r => r.impact).reduce((a, b) => a + b) / Object.keys(itemsRisk).length;
//     }
    
//     return 0;
// }

function getMaxImpactRisk(questions) {
    let maxRisk = 0;
    questions.filter(q => q['Type of question'] === "impact").forEach(question => {
        let questionVal = 1;
        if (question.hasOwnProperty("Weight")){
            questionVal = Number(question.Weight);
        }
        maxRisk += questionVal * Math.max.apply(Math, question.Answers.map(ans => { return ans.val}));
    });

    return maxRisk;
}

// Get maximum possible criticality risk score for an item, given a resource type the criticlity applies to.
// if no resource type, applies globally to item
function getMaxCriticalityRisk(questions, resourceType="") {
    let maxRisk = 0;
    questions.filter(q => q['Type of question'] === "criticality" && (q['Question for each'] || "").split(";")[0] === resourceType).forEach(question => {
        const questionVal = question.Weight || 1;
        maxRisk += questionVal * Math.max.apply(Math, question.Answers.map(ans => { return ans.val}));
    });
    return maxRisk;
}