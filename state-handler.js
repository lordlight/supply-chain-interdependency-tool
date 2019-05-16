const process = require('process');

const { app, ipcMain, dialog } = require('electron');
const fs = require('fs');

const csvParser = require('csv-parser');
const csvSync = require('csv-parse/lib/sync');
const { parse } = require('json2csv');
const stripBom = require('strip-bom'); // Needed because fs has no encoding, like utf-8-sig in python, for files with BOM (byte order mark)
const stripBomStream = require('strip-bom-stream');

let sessionData = {
	suppliers: [],
	products: [],
	projects: [],
	supplierQuestions: [], // {id: qid, label: "question?", riskWeighting: 1.0, critWeighting: 0.5, answers: [{id: aid, label: "answer", value: 1}]}
	productQuestions: [],
	projectQuestions: [],
	supplierResponses: {}, // {supplierId: { questionId: {answerInd: int, value: num} } }
	productResponses: {},
	projectResponses: {}
}

// Constants for file names that will contain the data.

const questionPaths = [
	{path: "/assets/supplier-questions.csv", type: "supplierQuestions"},
	{path: "/assets/product-questions.csv", type: "productQuestions"},
	{path: "/assets/project-questions.csv", type: "projectQuestions"}
];

const responsePaths = [
	{path: "supplier-responses.json", type: "supplierResponses"},
	{path: "product-responses.json", type: "productResponses"},
	{path: "project-responses.json", type: "projectResponses"}
]

const resourcePaths = [
	{path: "suppliers.csv", type: "suppliers"},
	{path: "products.csv", type: "products"},
	{path: "projects.csv", type: "projects"},
];

// Load any previuosly generated session data.
loadSessionData = () => {
	const appPath = app.getPath('appData') + "/" + app.getName();
	// If the CSCRM app folder does not exist, create it.
	if (!fs.existsSync(appPath)){
		fs.mkdirSync(appPath);
	}

	const dataPath = appPath + "/data";
	// If the data folder does not exist, create it.
	if (!fs.existsSync(dataPath)){
		fs.mkdirSync(dataPath);
	}

	// Load data given by user
	resourcePaths.forEach((resource) => {
		loadCSVFileContents(dataPath + "/" + resource.path, resource.type, data => {
			data.forEach(d => d._cscrm_active && (d._cscrm_active = parseInt(d._cscrm_active)));
			return data;
		})
	});

	// Load question data
	questionPaths.forEach((questionItem) => {
		loadCSVFileContents(__dirname + "/" + questionItem.path, questionItem.type);
	});

	// Convert answers to json, instead of the 'value={number};label="Some text" | ...' strings
	convertAnswers();

	// Load response data
	responsePaths.forEach ((responseItem) => {
		loadJSONFileContents(dataPath + "/" + responseItem.path, responseItem.type);
	});

	// Add empty objects for to eventually hold responses for each supplier, product, and project.
	createCorrespondingResponses();
}

convertAnswers = () => {
	let questionGroups = [sessionData.supplierQuestions, sessionData.productQuestions, sessionData.projectQuestions];

	questionGroups.forEach( (group) => {
		group.forEach( (question) => {
			if (question.hasOwnProperty("Answers")){
				let answers = [];
				let answerString = question.Answers.trim();
				let splitAnswers = answerString.split(" | ");
				
				splitAnswers.forEach((answerString) => {
					let splitAns = answerString.split(";");
					if (splitAns.length == 2){
						let answerVal = Number(splitAns[0].replace("value=", ""));
						let answerLabel = splitAns[1].replace("label=", "").replace(/\"/g, '');
						answers.push({val: answerVal, label: answerLabel});
					}
				});

				question.Answers = answers;
			}
		})
	});
}

createCorrespondingResponses = () => {
	let responseGroups = [
		{itemList: sessionData.suppliers, responses: sessionData.supplierResponses},
		{itemList: sessionData.products, responses: sessionData.productResponses},
		{itemList: sessionData.projects, responses: sessionData.projectResponses}
	];

	responseGroups.forEach((group) => {
		group.itemList.forEach((item) => {
			if (!group.responses.hasOwnProperty(item.ID)){
				group.responses[item.ID] = {};
			}
		});
	});
}

loadCSVFileContents = (path, itemType, cb) => {
	let itemData = [];
	if (fs.existsSync(path)){
		try {
			let data = fs.readFileSync(path);
			data = stripBom(data.toString());
			try {
				itemData = csvSync(data, {columns: true});
				if (cb) {
					itemData = cb(itemData);
				}
				updateSessionData(itemData, itemType);
			} catch(csvErr){
				console.log("csv error with ", path);
			}
		} catch (err){
			console.log("error loading ", path, ", error: ", err);
		}
	}
}

loadJSONFileContents = (path, itemType) => {
	if (fs.existsSync(path)){
		try {
			let data = JSON.parse(fs.readFileSync(path));
			updateSessionData(data, itemType);
		} catch (err){
			console.log("**loadJSONFileContents: error loading ", path, ", error: ", err);
		}
	}
}

saveSessionData = (event, type) => {
	const appPath = app.getPath('appData') + "/" + app.getName();
	// If the CSCRM app folder does not exist, create it.
	if (!fs.existsSync(appPath)){
		fs.mkdirSync(appPath);
	}

	const dataPath = appPath + "/data";
	// If the data folder does not exist, create it.
	if (!fs.existsSync(dataPath)){
		fs.mkdirSync(dataPath);
	}
	
	if (type === "resources"){
		resourcePaths.forEach( (resource) => {
			if (sessionData[resource.type].length > 0){
				try {
					const csv = parse(sessionData[resource.type]);
					fs.writeFile(dataPath + "/" +resource.path, csv, err => {
						if (!err){
							console.log(resource.type, " saved");
							event.sender.send('save-confirm', resource.type + " saved");
						} else {
							console.log("save write error: ", err);
							event.sender.send('save-error', err);
						}
					});
				} catch (csvErr) {
					console.log("save csv error: ", csvErr);
					event.sender.send('save-error', csvErr);
				}
				// json2csv.json2csv(sessionData[resource.type], (err, csv) => {
				// 	if (!err){
				// 		fs.writeFile(dataPath + "/" +resource.path, csv, (csvErr) => {
				// 			if (!csvErr){
				// 				console.log(resource.type, " saved");
				// 				event.sender.send('save-confirm', resource.type + " saved");
				// 			} else {
				// 				console.log("save csv error: ", csvErr);
				// 				event.sender.send('save-error', csvErr);
				// 			}
				// 		});
				// 	} else {
				// 		console.log("save write error: ", err);
				// 		event.sender.send('save-error', err);
				// 	}
				// });
			}
		});
	} else if (type === "responses"){
		responsePaths.forEach((path) => {
			if (Object.keys(sessionData[path.type]).length > 0){
				let data = JSON.stringify(sessionData[path.type]);
				fs.writeFile(dataPath + "/" +path.path, data, (err) => {
					if (!err){
						console.log(path.type, " saved");
						event.sender.send('save-confirm', path.type + " saved");
					} else {
						console.log("save error: ", err);
						event.sender.send('save-error', err);
					}
				});
			}
		});
	}
}

updateSessionData = (data, type, keepInactive = false) => {
	if (sessionData.hasOwnProperty(type)){
		if (keepInactive) {
			const updated = data.map(d => {return {...d, _cscrm_active: 1}});
			const updatedIds = new Set(updated.map(d => d.ID));
			const inactive = sessionData[type].filter(d => !updatedIds.has(d.ID));
			inactive.forEach(d => d._cscrm_active = 0);
			data = [...updated, ...inactive];
		}
		sessionData[type] = data;
	} else {
		console.error("updateSessionData() - sessionData does not have property: ", type);
	}
	return data;
}

/*getAppRoot = () => {
	const appPath = app.getPath('exe');
	const appName = app.getName();

	let appRoot = "";

	console.log("getAppRoot: ", appPath, ", name: ", appName);

	if (process.platform === 'darwin'){
		console.log("***Platform is MacOS");
		let appIndex = appPath.indexOf(appName+".app");
		if (appIndex > -1){
			appRoot = appPath.substring(0, appIndex);
		} else {
			appRoot = app.getAppPath();
		}
	} else if (process.platform === 'win32'){
		console.log("***Platform is Windows");
		let appIndex = appPath.indexOf(appName+".exe");
		if (appIndex > -1){
			appRoot = appPath.substring(0, appIndex);
		} else {
			appRoot = app.getAppPath();
		}
	} else {
		appRoot = app.getAppPath();
	}

	return appRoot;
}*/

// Functions and event handlers for communicating with data.
ipcMain.on('renderer-loaded', (event) => {
	event.sender.send('init-state', sessionData);
	//event.sender.send('app-loc', app.getPath('appData'));
});

ipcMain.on('open-import', (event) => {
	let importFile = dialog.showOpenDialog({ properties: ['openFile'] });
	event.sender.send('return-import', importFile);
});

ipcMain.on('response-update', (event, changedResponses) => {
	//console.log("changed: ", changedResponses);
	changedResponses.forEach((responseSet) => {
		Object.keys(responseSet).forEach((typeKey) => {
			Object.keys(responseSet[typeKey]).forEach((itemKey) => {
				sessionData[typeKey][itemKey] = responseSet[typeKey][itemKey]
			});
		});
	});
	saveSessionData(event, "responses");
});

ipcMain.on('asynchronous-file-load', (event, req) => {
	let response = {error: null, data:[], type:null};

	if (!req.type || !req.filePath){
		response.error = "Missing type or file path.";
		event.sender.send('asynchronous-file-response', response);
	} else {
		const filePath = req.filePath;
		const keepInactive = req.keepInactive;
		response.type = req.type;

		console.log("asynch file load, filePath: ", filePath);

		if (filePath === null || typeof(filePath) === 'undefined'){
			response.error = "**ERROR** The file path was not given.";
			event.sender.send('asynchronous-file-response', response);
		} else {
			if (filePath.endsWith(".csv")){
				try {
					fs.createReadStream(filePath)
					.pipe(stripBomStream())
					.pipe(csvParser())
					.on('data', (data) => {
						response.data.push(data);
					})
					.on('end', () => {
						response.data = updateSessionData(response.data, response.type, keepInactive);
						event.sender.send('asynchronous-file-response', response);

						saveSessionData(event, "resources");
						createCorrespondingResponses();
						console.log("done");
					});
				} catch (err){
					response.error = "**ERROR**" + err;
					event.sender.send('asynchronous-file-response', response);
				}
			} else {
				response.error = "**ERROR** Not a CSV";
				event.sender.send('asynchronous-file-response', response);
			}
		}
	}
});