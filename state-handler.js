const process = require('process');

const { app, ipcMain } = require('electron');
const fs = require('fs');

const csvParser = require('csv-parser');
const csvSync = require('csv-parse/lib/sync');
const json2csv = require('json-2-csv');
const stripBom = require('strip-bom'); // Needed because fs has no encoding, like utf-8-sig in python, for files with BOM (byte order mark)

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
		loadCSVFileContents(dataPath + "/" + resource.path, resource.type);
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

	console.log("supplier responses: ", sessionData.supplierResponses);

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

loadCSVFileContents = (path, itemType) => {
	let itemData = [];
	if (fs.existsSync(path)){
		try {
			let data = fs.readFileSync(path);
			data = stripBom(data.toString());
			try {
				itemData = csvSync(data, {columns: true});
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
				json2csv.json2csv(sessionData[resource.type], (err, csv) => {
					if (!err){
						fs.writeFile(dataPath + "/" +resource.path, csv, (csvErr) => {
							if (!csvErr){
								console.log(resource.type, " saved");
								event.sender.send('save-confirm', resource.type + " saved");
							} else {
								console.log("save csv error: ", csvErr);
								event.sender.send('save-error', csvErr);
							}
						});
					} else {
						console.log("save write error: ", err);
						event.sender.send('save-error', err);
					}
				});
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

updateSessionData = (data, type) => {
	if (sessionData.hasOwnProperty(type)){
		sessionData[type] = data;
	} else {
		console.error("updateSessionData() - sessionData does not have property: ", type);
	}
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

	if (!req.type || !req.filesToLoad){
		response.error = "Missing type or files to upload.";
		event.sender.send('asynchronous-file-response', response);
	} else {
		const files = req.filesToLoad;
		response.type = req.type;

		//console.log("files: ", files);

		files.forEach((file) => {
			if (!file.path || !file.name){
				response.error = "**ERROR** One did not have the name and/or path properties.";
				event.sender.send('asynchronous-file-response', response);
			} else {
				if (file.path.endsWith(".csv")){
					try {
						fs.createReadStream(file.path)
						.pipe(csvParser())
						.on('data', (data) => {
							response.data.push(data);
						})
						.on('end', () => {
							event.sender.send('asynchronous-file-response', response);

							updateSessionData(response.data, response.type);

							saveSessionData(event, "resources");
							createCorrespondingResponses();
							console.log("done");
						});
					} catch (err){
						response.error = error;
						event.sender.send('asynchronous-file-response', response);
					}
				} else {
					event.sender.send('asynchronous-file-response', response);
				}
			}
		});
	}
});