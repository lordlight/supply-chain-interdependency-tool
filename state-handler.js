const process = require('process');

const { app, ipcMain } = require('electron');
const fs = require('fs');

const csvParser = require('csv-parser');
const csvSync = require('csv-parse/lib/sync');
const json2csv = require('json-2-csv');

let questions = {
	supplier: [], // {id: qid, label: "question?", riskWeighting: 1.0, critWeighting: 0.5, answers: [{id: aid, label: "answer", value: 1}]}
	product: [],
	project: []
};

let sessionData = {
	suppliers: [],
	products: [],
	projects: [],
	supplierResponses: {}, // {supplierId: sid, responses: [ {questionId: qid, answerId, aid} ]}
	productResponses: {},
	projectResponses: {}
}

// TODO: Load supplier questions
// TODO: Load product questions
// TODO: Load project questions

const resourcePaths = [
	{path: "suppliers.csv", type: "suppliers"},
	{path: "products.csv", type: "products"},
	{path: "projects.csv", type: "projects"},
];

// Load any previuosly generated session data.
loadSessionData = () => {
	const appRoot = getAppRoot();
	const dataPath = appRoot + "/data";

	// If the data folder does not exist, create it.
	if (!fs.existsSync(dataPath)){
		fs.mkdirSync(dataPath);
	}

	resourcePaths.forEach( (resource) => {
		let resourceData = [];
		if (fs.existsSync(dataPath + "/" + resource.path)){
			try {
				data = fs.readFileSync(dataPath + "/"  + resource.path, 'utf8');
				try {
					resourceData = csvSync(data, {columns: true});
					updateSessionData(resourceData, resource.type);
				} catch(csvErr){
					console.log("csv error with ", resource.path);
				}
			} catch (err){
				console.log("error loading ", resource.path);
			}
		}
	});
}

saveSessionData = (event) => {
	const appRoot = getAppRoot();
	const dataPath = appRoot + "/data";

	// If the data folder does not exist, create it.
	if (!fs.existsSync(dataPath)){
		fs.mkdirSync(dataPath);
	}
	
	resourcePaths.forEach( (resource) => {
		if (sessionData[resource.type].length > 0){
			json2csv.json2csv(sessionData[resource.type], (err, csv) => {
				if (!err){
					fs.writeFile(dataPath + "/" +resource.path, csv, (csvErr) => {
						if (!csvErr){
                            console.log(resource.type, " saved");
                            event.sender.send('save-confirm', resource.type + " saved");
                        } else {
                            event.sender.send('save-error', csvErr);
                        }
					});
				} else {
                    event.sender.send('save-error', err);
                }
			});
		}
	});
}

updateSessionData = (data, type) => {
	if (type === "suppliers"){
		sessionData.suppliers = data;
	} else if (type === "products"){
		sessionData.products = data;
	} else if (type === "projects"){
		sessionData.projects = data;
	}
}

getAppRoot = () => {
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
}

// Functions and event handlers for communicating with data.
ipcMain.on('renderer-loaded', (event) => {
	event.sender.send('init-state', sessionData);
	//event.sender.send('app-loc', getAppRoot());
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

							saveSessionData(event);
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