const { app, BrowserWindow, shell, ipcMain, Menu, TouchBar } = require('electron');
const { TouchBarButton, TouchBarLabel, TouchBarSpacer } = TouchBar;
const fs = require('fs');
const Promise = require('promise');

const path = require('path');
let isDev = require('electron-is-dev');

const csvParser = require('csv-parser');
const csvSync = require('csv-parse/lib/sync');
const json2csv = require('json-2-csv');

console.log("dirname: ", __dirname);

let mainWindow;

let questions = {
	supplier: [], // {id: qid, label: "question?", riskWeighting: 1.0, critWeighting: 0.5, answers: [{id: aid, label: "answer", value: 1}]}
	product: [],
	project: []
};

let sessionData = {
	suppliers: [],
	products: [],
	projects: [],
	supplierResponses: {},
	productResponses: {},
	projectResponses: {}
}

// TODO: Load supplier questions
// TODO: Load product questions
// TODO: Load project questions

const resourcePaths = [
	{path: "/data/suppliers.csv", type: "suppliers"},
	{path: "/data/products.csv", type: "products"},
	{path: "/data/projects.csv", type: "projects"},
];

// Load any previuosly generated session data.
loadSessionData = () => {
	resourcePaths.forEach( (resource) => {
		let resourceData = [];
		if (fs.existsSync(__dirname + resource.path)){
			try {
				data = fs.readFileSync(__dirname + resource.path, 'utf8');
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

saveSessionData = () => {
	resourcePaths.forEach( (resource) => {
		if (sessionData[resource.type].length > 0){
			json2csv.json2csv(sessionData[resource.type], (err, csv) => {
				if (!err){
					fs.writeFile(__dirname+resource.path, csv, (csvErr) => {
						if (!csvErr){
							console.log(resource.type, " saved");
						}
					});
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

// TODO: Load reponses to supplier questions
// TODO: Load responses to product questions
// TODO: Load responses to project questions

createWindow = () => {
	mainWindow = new BrowserWindow({
		backgroundColor: '#F7F7F7',
		minWidth: 880,
		show: false,
		titleBarStyle: 'default',
		webPreferences: {
			nodeIntegration: false,
			preload: __dirname + '/../preload.js',
		},
		height: 860,
		width: 1280,
	});

	mainWindow.loadURL(
		isDev
			? 'http://localhost:3000'
			: `file://${path.join(__dirname, '../build/index.html')}`,
	);

	if (isDev) {
		const {
			default: installExtension,
			REACT_DEVELOPER_TOOLS,
			REDUX_DEVTOOLS,
		} = require('electron-devtools-installer');

		installExtension(REACT_DEVELOPER_TOOLS)
			.then(name => {
				console.log(`Added Extension: ${name}`);
			})
			.catch(err => {
				console.log('An error occurred: ', err);
			});

		installExtension(REDUX_DEVTOOLS)
			.then(name => {
				console.log(`Added Extension: ${name}`);
			})
			.catch(err => {
				console.log('An error occurred: ', err);
			});
	}

	mainWindow.once('ready-to-show', () => {
		mainWindow.show();

		ipcMain.on('open-external-window', (event, arg) => {
			shell.openExternal(arg);
		});
	});

	mainWindow.webContents.openDevTools();
};

generateMenu = () => {
	const template = [
		{
			label: 'File',
			submenu: [{ role: 'about' }, { role: 'quit' }],
		},
		{
			label: 'Edit',
			submenu: [
				{ role: 'undo' },
				{ role: 'redo' },
				{ type: 'separator' },
				{ role: 'cut' },
				{ role: 'copy' },
				{ role: 'paste' },
				{ role: 'pasteandmatchstyle' },
				{ role: 'delete' },
				{ role: 'selectall' },
			],
		},
		{
			label: 'View',
			submenu: [
				{ role: 'reload' },
				{ role: 'forcereload' },
				{ role: 'toggledevtools' },
				{ type: 'separator' },
				{ role: 'resetzoom' },
				{ role: 'zoomin' },
				{ role: 'zoomout' },
				{ type: 'separator' },
				{ role: 'togglefullscreen' },
			],
		},
		{
			role: 'window',
			submenu: [{ role: 'minimize' }, { role: 'close' }],
		},
		{
			role: 'help',
			submenu: [
				{
					click() {
						require('electron').shell.openExternal(
							'https://getstream.io/winds',
						);
					},
					label: 'Learn More',
				},
				{
					click() {
						require('electron').shell.openExternal(
							'https://github.com/GetStream/Winds/issues',
						);
					},
					label: 'File Issue on GitHub',
				},
			],
		},
	];

	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

app.on('ready', () => {
	loadSessionData();
	createWindow();
	generateMenu();


});

app.on('window-all-closed', () => {
	app.quit();
});

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow();
	}
});

// Functions and event handlers for communicating with data.
ipcMain.on('renderer-loaded', (event) => {
	event.sender.send('init-state', sessionData);
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

							saveSessionData();
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