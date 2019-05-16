
export function calculateItemRisk(responses, questions) {
    let perItemRisk = {};
    // For each item (supplier, product, project) with responses
    Object.entries(responses).forEach((responseEntry) => {
        let itemId = responseEntry[0];
        let itemResponses = responseEntry[1];

        perItemRisk[itemId] = 0;
        //let numQuestions = 0;
        questions.forEach((question) => {
            //numQuestions += 1;
            let questionVal = 1;
            if (question.hasOwnProperty("Weight")){
                questionVal = Number(question.Weight);
            }

            if (itemResponses.hasOwnProperty(question.ID)){
                let ansInd = parseInt(itemResponses[question.ID]);
                if (ansInd < 0) ansInd = 0;
                //console.log("****answer given: ", questionVal * (question.Answers[ansInd].val));
                perItemRisk[itemId] += questionVal * (question.Answers[ansInd].val);
            } else {
                //console.log("no answer given: ",  Math.max.apply(Math, question.Answers.map(ans => { return ans.val})))
                perItemRisk[itemId] += questionVal * Math.max.apply(Math, question.Answers.map(ans => { return ans.val}));
            }
        });
        //console.log(itemId, " has this many questions: ", numQuestions);
        perItemRisk[itemId] = perItemRisk[itemId] / getMaxRisk(questions) * 100;
    });
    //console.log("per item risk: ", perItemRisk);
    return perItemRisk;
}

export function calculateTypeRiskFromItemsRisk(itemsRisk){
    // Retun the sum of all the items' risks (defaulting to 0 if there are no items) divided by the total risk items.
    if (Object.values(itemsRisk).length > 0) {
        return Object.values(itemsRisk).reduce((a, b) => a + b) / Object.keys(itemsRisk).length;
    }
    
    return 0;
}

function getMaxRisk(questions){
    let maxRisk = 0;
    questions.forEach(question => {
        let questionVal = 1;
        if (question.hasOwnProperty("Weight")){
            questionVal = Number(question.Weight);
        }
        maxRisk += questionVal * Math.max.apply(Math, question.Answers.map(ans => { return ans.val}));
    });

    return maxRisk;
}