const process = require("process");

const { app, ipcMain, dialog } = require("electron");
const fs = require("fs-extra");

const Store = require("electron-store");
const store = new Store({ accessPropertiesByDotNotation: false });

const csvParser = require("csv-parser");
const csvSync = require("csv-parse/lib/sync");
const { parse } = require("json2csv");
const stripBom = require("strip-bom"); // Needed because fs has no encoding, like utf-8-sig in python, for files with BOM (byte order mark)
const stripBomStream = require("strip-bom-stream");

mutableData = () => {
  return {
    suppliers: [],
    products: [],
    projects: [],
    supplierResponses: {},
    productResponses: {},
    projectResponses: {}
  };
};

let sessionData = {
  supplierQuestions: [],
  productQuestions: [],
  projectQuestions: [],
  ...mutableData()
};

// Constants for file names that will contain the data.

const questionPaths = [
  { path: "/assets/supplier-questions.csv", type: "supplierQuestions" },
  { path: "/assets/product-questions.csv", type: "productQuestions" },
  { path: "/assets/project-questions.csv", type: "projectQuestions" }
];

const responsePaths = [
  { path: "supplier-responses.json", type: "supplierResponses" },
  { path: "product-responses.json", type: "productResponses" },
  { path: "project-responses.json", type: "projectResponses" }
];

const resourcePaths = [
  { path: "suppliers.csv", type: "suppliers" },
  { path: "products.csv", type: "products" },
  { path: "projects.csv", type: "projects" }
];

// Load any previuosly generated session data.
loadSessionData = () => {
  const appPath = app.getPath("appData") + "/" + app.getName();
  // If the CSCRM app folder does not exist, create it.
  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath);
  }

  const dataPath = appPath + "/data";
  // If the data folder does not exist, create it.
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
  }

  // Load data given by user
  resourcePaths.forEach(resource => {
    loadCSVFileContents(dataPath + "/" + resource.path, resource.type, data => {
      data.forEach(
        d => d._cscrm_active && (d._cscrm_active = parseInt(d._cscrm_active))
      );
      return data;
    });
  });

  // Load question data
  questionPaths.forEach(questionItem => {
    loadCSVFileContents(__dirname + "/" + questionItem.path, questionItem.type);
  });

  // Convert answers to json, instead of the 'value={number};label="Some text" | ...' strings
  convertAnswers();

  // Load response data
  responsePaths.forEach(responseItem => {
    loadJSONFileContents(dataPath + "/" + responseItem.path, responseItem.type);
  });

  // Add empty objects for to eventually hold responses for each supplier, product, and project.
  createCorrespondingResponses();
};

convertAnswers = () => {
  let questionGroups = [
    sessionData.supplierQuestions,
    sessionData.productQuestions,
    sessionData.projectQuestions
  ];

  questionGroups.forEach(group => {
    group.forEach(question => {
      if (question.hasOwnProperty("Answers")) {
        let answers = [];
        let answerString = question.Answers.trim();
        let splitAnswers = answerString.split(" | ");

        splitAnswers.forEach(answerString => {
          let splitAns = answerString.split(";");
          if (splitAns.length == 2) {
            let answerVal = Number(splitAns[0].replace("value=", ""));
            let answerLabel = splitAns[1]
              .replace("label=", "")
              .replace(/\"/g, "");
            answers.push({ val: answerVal, label: answerLabel });
          }
        });

        question.Answers = answers;
      }
    });
  });
};

createCorrespondingResponses = () => {
  let responseGroups = [
    {
      itemList: sessionData.suppliers,
      responses: sessionData.supplierResponses
    },
    { itemList: sessionData.products, responses: sessionData.productResponses },
    { itemList: sessionData.projects, responses: sessionData.projectResponses }
  ];

  responseGroups.forEach(group => {
    group.itemList.forEach(item => {
      if (!group.responses.hasOwnProperty(item.ID)) {
        group.responses[item.ID] = {};
      }
    });
  });
};

loadCSVFileContents = (path, itemType, cb) => {
  let itemData = [];
  if (fs.existsSync(path)) {
    try {
      let data = fs.readFileSync(path);
      data = stripBom(data.toString());
      try {
        itemData = csvSync(data, { columns: true });
        if (cb) {
          itemData = cb(itemData);
        }
        updateSessionData(itemData, itemType);
      } catch (csvErr) {
        console.log("csv error with ", path);
      }
    } catch (err) {
      console.log("error loading ", path, ", error: ", err);
    }
  }
};

loadJSONFileContents = (path, itemType) => {
  if (fs.existsSync(path)) {
    try {
      let data = JSON.parse(fs.readFileSync(path));
      updateSessionData(data, itemType);
    } catch (err) {
      console.log(
        "**loadJSONFileContents: error loading ",
        path,
        ", error: ",
        err
      );
    }
  }
};

saveSessionData = (event, type) => {
  const appPath = app.getPath("appData") + "/" + app.getName();
  // If the CSCRM app folder does not exist, create it.
  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath);
  }

  const dataPath = appPath + "/data";
  // If the data folder does not exist, create it.
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
  }

  if (type === "resources") {
    resourcePaths.forEach(resource => {
      if (sessionData[resource.type].length > 0) {
        try {
          const csv = parse(sessionData[resource.type]);
          fs.writeFile(dataPath + "/" + resource.path, csv, err => {
            if (!err) {
              console.log(resource.type, " saved");
              event.sender.send("save-confirm", resource.type + " saved");
            } else {
              console.log("save write error: ", err);
              event.sender.send("save-error", err);
            }
          });
        } catch (csvErr) {
          console.log("save csv error: ", csvErr);
          event.sender.send("save-error", csvErr);
        }
      }
    });
  } else if (type === "responses") {
    responsePaths.forEach(path => {
      if (Object.keys(sessionData[path.type]).length > 0) {
        let data = JSON.stringify(sessionData[path.type]);
        fs.writeFile(dataPath + "/" + path.path, data, err => {
          if (!err) {
            console.log(path.type, " saved");
            event.sender.send("save-confirm", path.type + " saved");
          } else {
            console.log("save error: ", err);
            event.sender.send("save-error", err);
          }
        });
      }
    });
  }
};

// required in import file header row
const REQUIRED_IMPORT_HEADERS = {
  products: ["ID", "Name", "Supplier ID", "Project ID"],
  suppliers: ["ID", "Name"],
  projects: ["ID", "Level", "Name"]
};

// required fields for each data row in import file
const REQUIRED_IMPORT_FIELDS = {
  products: ["ID", "Name"],
  suppliers: ["ID", "Name"],
  projects: ["ID", "Level", "Name"]
};

validateImport = (data, type) => {
  // types of validation errors:
  // - empty import
  // - imported data is not of correct type; does not have the headers required
  // - all data has all required fields (subset of required headers)
  // - no duplicate IDs
  // - for product relations, no repeats

  // see if any data at all
  if (data.length === 0) {
    return { success: false, error: "No data" };
  }

  // see if required fields even exist in file
  const headersMissing = REQUIRED_IMPORT_HEADERS[type].filter(
    field => data[0][field] == undefined
  );
  if (headersMissing.length > 0) {
    return {
      success: false,
      error: `Missing in header row: ${headersMissing.join(", ")}`
    };
  }

  // make sure all rows have required fields
  const fieldsWithMissing = REQUIRED_IMPORT_FIELDS[type].filter(field =>
    data.some(row => !row[field])
  );
  if (fieldsWithMissing.length > 0) {
    return {
      success: false,
      error: `One or more rows missing these fields: ${fieldsWithMissing.join(
        ", "
      )}`
    };
  }

  // check for duplicate IDs
  const allIds = new Set(data.map(row => row.ID));
  if (allIds.size < data.length) {
    return {
      success: false,
      error: "Import file rows cannot have duplicate IDs"
    };
  }

  // the "|" character is reserved
  if (
    data.some(row => row.ID.indexOf("|") !== -1 || row.ID.indexOf(";") !== -1)
  ) {
    return {
      success: false,
      error: 'IDs cannot contain the characters "|" or ";"'
    };
  }

  // ensure valid relations (for products)
  if (type === "products") {
    const relationFields = ["Supplier ID", "Project ID"];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (let j = 0; j < relationFields.length; j++) {
        const field = relationFields[j];
        relations = row[field].split(";");
        // for product relations, check no duplicates
        if (relations.length !== new Set(relations).size) {
          return {
            success: false,
            error: `One or more rows have duplicate relations in ${field}`
          };
        }
        // check no relation contains the reserved character "|"
        if (relations.some(rel => rel.indexOf("|") !== -1)) {
          return {
            success: false,
            error: `${field} relations cannot contain the character "|"`
          };
        }
      }
    }
  }

  return { success: true };
};

updateSessionData = (data, type, keepInactive = false) => {
  if (sessionData.hasOwnProperty(type)) {
    if (keepInactive) {
      const updated = data.map(d => {
        return { ...d, _cscrm_active: 1 };
      });
      const updatedIds = new Set(updated.map(d => d.ID));
      const inactive = sessionData[type].filter(d => !updatedIds.has(d.ID));
      inactive.forEach(d => (d._cscrm_active = 0));
      data = [...updated, ...inactive];
    }
    sessionData[type] = data;
  } else {
    console.error(
      "updateSessionData() - sessionData does not have property: ",
      type
    );
  }
  return data;
};

// Functions and event handlers for communicating with data.
ipcMain.on("renderer-loaded", event => {
  event.sender.send("init-state", sessionData);
  const preferences = store.store;
  event.sender.send("init-preferences", preferences);
  //event.sender.send('app-loc', app.getPath('appData'));
});

ipcMain.on("update-preferences", (event, payload) => {
  store.set(payload);
});

ipcMain.on("open-import", event => {
  let importFile = dialog.showOpenDialog({ properties: ["openFile"] });
  event.sender.send("return-import", importFile);
});

ipcMain.on("response-update", (event, changedResponses) => {
  changedResponses.forEach(responseSet => {
    Object.keys(responseSet).forEach(typeKey => {
      Object.keys(responseSet[typeKey]).forEach(itemKey => {
        sessionData[typeKey][itemKey] = responseSet[typeKey][itemKey];
      });
    });
  });
  saveSessionData(event, "responses");
});

ipcMain.on("asynchronous-file-load", (event, req) => {
  let response = { error: null, data: [], type: null };

  if (!req.type || !req.filePath) {
    response.error = "Missing type or file path.";
    event.sender.send("asynchronous-file-response", response);
  } else {
    const filePath = req.filePath;
    const keepInactive = req.keepInactive;
    response.type = req.type;

    console.log("asynch file load, filePath: ", filePath);

    if (filePath === null || typeof filePath === "undefined") {
      response.error = "**ERROR** The file path was not given.";
      event.sender.send("asynchronous-file-response", response);
    } else {
      if (filePath.endsWith(".csv")) {
        try {
          fs.createReadStream(filePath)
            .pipe(stripBomStream())
            .pipe(csvParser())
            .on("data", data => {
              response.data.push(data);
            })
            .on("end", () => {
              const validation = validateImport(response.data, response.type);
              if (validation.success) {
                response.data = updateSessionData(
                  response.data,
                  response.type,
                  keepInactive
                );
                event.sender.send("asynchronous-file-response", response);

                saveSessionData(event, "resources");
                createCorrespondingResponses();
              } else {
                response.error = "**ERROR**" + validation.error;
                event.sender.send("asynchronous-file-response", response);
              }
            });
        } catch (err) {
          response.error = "**ERROR**" + err;
          event.sender.send("asynchronous-file-response", response);
        }
      } else {
        response.error = "**ERROR** Not a CSV";
        event.sender.send("asynchronous-file-response", response);
      }
    }
  }
});

ipcMain.on("clear-all-data", (event, req) => {
  const appPath = app.getPath("appData") + "/" + app.getName();
  const dataPath = appPath + "/data";
  // assume success?
  fs.emptyDirSync(dataPath);
  sessionData = {
    ...sessionData,
    ...mutableData()
  };
  store.clear();
  event.sender.send("clear-all-data-response", { status: 0 });
});
