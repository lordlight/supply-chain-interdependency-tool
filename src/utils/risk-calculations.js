import { getQuestionResponse, getCellMultiples } from "./general-utils";

// store here as constant for now, may want to put in data
const NORMALIZED_VALUES = {
  suppliers_access: 100,
  suppliers_assurance: 100,
  products_access: 100,
  products_dependency: 100,
  products_criticality: 1,
  projects_criticality: 10,
  assets_criticality: 10
};

export function calculateItemRisk(
  resourceType,
  responses,
  questions,
  resources
) {
  const handleQuestionResponse = (
    itemRisk,
    itemResponses,
    question,
    qid,
    qtype,
    ckey = null
  ) => {
    if (itemResponses.hasOwnProperty(qid)) {
      const ansInd = Math.max(
        parseInt(getQuestionResponse(itemResponses[qid])),
        0
      );
      if (ckey != null) {
        itemRisk[qtype][ckey] =
          (itemRisk[qtype][ckey] || 0) + question.Answers[ansInd].val;
      } else {
        itemRisk[qtype] = (itemRisk[qtype] || 0) + question.Answers[ansInd].val;
      }
    } else if (ckey != null) {
      itemRisk[qtype][ckey] =
        (itemRisk[qtype][ckey] || 0) +
        Math.max.apply(
          Math,
          question.Answers.map(ans => {
            return ans.val;
          })
        );
    } else {
      itemRisk[qtype] =
        (itemRisk[qtype] || 0) +
        Math.max.apply(
          Math,
          question.Answers.map(ans => {
            return ans.val;
          })
        );
    }
  };

  let perItemRisk = {};
  const resourcesMap = {};
  resources.forEach(r => (resourcesMap[r.ID] = r));

  // For each item (supplier, product, project) with responses
  Object.entries(responses).forEach(responseEntry => {
    let itemId = responseEntry[0];
    let itemResponses = responseEntry[1];

    // score, criticality is dictionary keyed by related resource type & id
    perItemRisk[itemId] = {
      Access: {},
      Criticality: {},
      Dependency: {},
      Assurance: 0
    };

    questions.forEach(question => {
      const qtype = question["Type of question"];
      const qkey = question.Relation;
      if (qtype === "Access") {
        // access applies to specific organization assets
        // both products and suppliers can have access
        const assetIdVal = question["Asset ID"];
        const assetIds = getCellMultiples(assetIdVal);
        assetIds.forEach(aid => {
          const ckey = `asset|${aid}`; // for key need type and id, concatenate
          const qid = `${question.ID}|${aid}`; // key into responses
          handleQuestionResponse(
            perItemRisk[itemId],
            itemResponses,
            question,
            qid,
            "Access",
            ckey
          );
        });
      } else if (qtype === "Criticality") {
        // responses for each related project
        // products can have criticality questions, and projects
        // have criticality to their parent (organization), as do assets
        const key = resourceType === "products" ? "Project ID" : "Parent ID";
        const projectIds = getCellMultiples(
          (resourcesMap[itemId] || {})[key] || ""
        );
        projectIds.forEach(pid => {
          const ckey = `project|${pid}`; // for key need type and id, concatenate
          const qid = qkey ? `${question.ID}|${pid}` : question.ID; // key into responses
          handleQuestionResponse(
            perItemRisk[itemId],
            itemResponses,
            question,
            qid,
            qtype,
            ckey
          );
        });
      } else if (qtype === "Dependency") {
        // responses for each related supplier
        // only applies to products
        const supplierIds = getCellMultiples(
          (resourcesMap[itemId] || {})["Supplier ID"] || ""
        );
        supplierIds.forEach(sid => {
          const ckey = `supplier|${sid}`; // for key need type and id, concatenate
          const qid = qkey ? `${question.ID}|${sid}` : question.ID; // key into responses
          handleQuestionResponse(
            perItemRisk[itemId],
            itemResponses,
            question,
            qid,
            qtype,
            ckey
          );
        });
      } else if (qtype === "Assurance") {
        // only applies to suppliers
        handleQuestionResponse(
          perItemRisk[itemId],
          itemResponses,
          question,
          question.ID,
          qtype
        );
      }
    });

    // normalize assurance
    const nval = NORMALIZED_VALUES[`${resourceType}_assurance`];
    perItemRisk[itemId].Assurance =
      (perItemRisk[itemId].Assurance / getMaxScore(questions, "Assurance")) *
      nval;

    // normalize access
    Object.keys(perItemRisk[itemId].Access || {}).forEach(qkey => {
      const [_, assetId] = qkey.split("|");
      const nval = NORMALIZED_VALUES[`${resourceType}_access`];
      const maxAccess = getMaxAccessScore(questions, assetId);
      perItemRisk[itemId].Access[qkey] =
        (perItemRisk[itemId].Access[qkey] / maxAccess) * nval;
    });

    // normalize criticalities
    const maxCriticality = getMaxScore(questions, "Criticality");
    Object.keys(perItemRisk[itemId].Criticality || {}).forEach(qkey => {
      const nval = NORMALIZED_VALUES[`${resourceType}_criticality`];
      perItemRisk[itemId].Criticality[qkey] =
        (perItemRisk[itemId].Criticality[qkey] / maxCriticality) * nval;
    });

    // normalize dependencies
    const maxDependency = getMaxScore(questions, "Dependency");
    Object.keys(perItemRisk[itemId].Dependency || {}).forEach(qkey => {
      const nval = NORMALIZED_VALUES[`${resourceType}_dependency`];
      perItemRisk[itemId].Dependency[qkey] =
        (perItemRisk[itemId].Dependency[qkey] / maxDependency) * nval;
    });
  });
  console.log("per item risk: ", perItemRisk);
  return perItemRisk;
}

export function computeImpacts(
  projectRisks,
  productRisks,
  supplierRisks,
  assetRisks,
  projects,
  products,
  suppliers,
  assets
) {
  const projectsMap = {};
  const productsMap = {};
  const suppliersMap = {};
  projects.forEach(p => (projectsMap[p.ID] = p));
  products.forEach(p => (productsMap[p.ID] = p));
  suppliers.forEach(s => (suppliersMap[s.ID] = s));

  let assuranceDependencyScoreEntries = [];
  let accessScoreEntries = [];
  const scores = {
    project: {},
    product: {},
    supplier: {}
  };
  // const projectScores = {};
  // const productScores = {};
  // const supplierScores = {};
  projects.forEach(
    p =>
      (scores.project[p.ID] = {
        assuranceDependency: [],
        supplyLines: [],
        impact: 0,
        interdependence: 0
      })
  );
  products.forEach(
    p =>
      (scores.product[p.ID] = {
        assuranceDependency: [],
        access: [],
        supplyLines: [],
        impact: 0,
        interdependence: 0
      })
  );
  suppliers.forEach(
    s =>
      (scores.supplier[s.ID] = {
        assuranceDependency: [],
        access: [],
        supplyLines: [],
        impact: 0,
        interdependence: 0
      })
  );
  const productSupplierAccessScores = {};
  products.forEach(p => {
    suppliers.forEach(
      s => (productSupplierAccessScores[`${p.ID}|${s.ID}`] = [])
    );
  });

  Object.entries(productRisks).forEach(entry => {
    const [productId, scores] = entry;
    Object.entries(scores.Dependency || {}).forEach(dpentry => {
      const [skey, dpscore] = dpentry;
      const supplierId = skey.split("|")[1];
      const supplier = supplierRisks[supplierId] || {};
      const assurance = supplier.Assurance || 0;
      Object.entries(scores.Criticality || {}).forEach(crentry => {
        const [pkey, crscore] = crentry;
        const projectId = pkey.split("|")[1];
        const project = projectRisks[projectId] || {};
        const prcrit =
          (Object.entries(project.Criticality || {})[0] || [])[1] || 0;
        const adscore = (assurance * dpscore * crscore * prcrit) / 1000.0;
        const adscoreEntry = {
          projectId,
          productId,
          supplierId,
          score: adscore
        };
        assuranceDependencyScoreEntries.push(adscoreEntry);
      });
      Object.entries(assetRisks).forEach(entry => {
        const [assetId, assetScores] = entry;
        let score =
          (Object.entries(assetScores.Criticality || {})[0] || [])[1] || 0;
        let normalizeFactor = 0.1;
        Object.entries(scores.Access).forEach(acentry => {
          const [akey, acscore] = acentry;
          const curAssetId = akey.split("|")[1];
          if (curAssetId === assetId) {
            score *= acscore;
            normalizeFactor *= 100;
          }
        });
        Object.entries(supplier.Access).forEach(acentry => {
          const [akey, acscore] = acentry;
          const curAssetId = akey.split("|")[1];
          if (curAssetId === assetId) {
            score *= acscore;
            normalizeFactor *= 100;
          }
        });
        if (normalizeFactor > 0.1) {
          score /= normalizeFactor;
          const accessScoreEntry = { assetId, productId, supplierId, score };
          accessScoreEntries.push(accessScoreEntry);
        }
      });
    });
  });
  assuranceDependencyScoreEntries.forEach(entry => {
    scores.project[entry.projectId].assuranceDependency.push(entry);
    scores.product[entry.productId].assuranceDependency.push(entry);
    scores.supplier[entry.supplierId].assuranceDependency.push(entry);
  });

  accessScoreEntries.forEach(entry => {
    scores.product[entry.productId].access.push(entry);
    scores.supplier[entry.supplierId].access.push(entry);
    productSupplierAccessScores[`${entry.productId}|${entry.supplierId}`].push(
      entry
    );
  });

  // can compute supply line scores now
  const supplyLineScores = assuranceDependencyScoreEntries.map(entry => {
    const accessKey = `${entry.productId}|${entry.supplierId}`;
    const accessScores = productSupplierAccessScores[accessKey];
    const score =
      entry.score + accessScores.reduce((acc, val) => acc + val.score, 0);
    return { ...entry, score };
  });

  supplyLineScores.forEach(entry => {
    scores.project[entry.projectId].supplyLines.push(entry);
    scores.product[entry.productId].supplyLines.push(entry);
    scores.supplier[entry.supplierId].supplyLines.push(entry);
  });

  // find top-level org "project"
  const orgs = projects.filter(p => !p.parent);
  orgs.forEach(org => (scores.project[org.ID].supplyLines = supplyLineScores));

  Object.values(scores).forEach(resourceInfo =>
    Object.values(resourceInfo).forEach(info => {
      info.impact = Math.max(...info.supplyLines.map(sl => sl.score), 0);
      info.interdependence = info.supplyLines
        .map(sl => sl.score)
        .reduce((acc, val) => acc + val, 0);
    })
  );

  console.log("SCORES", scores);
  return scores;
}

function getMaxScore(questions, questionType) {
  let maxScore = 0;
  questions
    .filter(q => q["Type of question"] === questionType)
    .forEach(question => {
      maxScore += Math.max.apply(
        Math,
        question.Answers.map(ans => {
          return ans.val;
        })
      );
    });

  return maxScore;
}

// Access questions tied to specific assets
function getMaxAccessScore(questions, assetId) {
  let maxScore = 0;
  questions
    .filter(
      q =>
        q["Type of question"] === "Access" &&
        getCellMultiples(q["Asset ID"]).indexOf(assetId) !== -1
    )
    .forEach(question => {
      maxScore += Math.max.apply(
        Math,
        question.Answers.map(ans => {
          return ans.val;
        })
      );
    });

  return maxScore;
}
