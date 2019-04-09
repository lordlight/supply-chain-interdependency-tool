This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Setup

### Install dependencies

Node, electron-packager, wait-on, [Wine](https://www.davidbaumgold.com/tutorials/wine-mac/)

#### Node.js

Go to the [Node.js download site](https://nodejs.org/en/download/) and download the installer for your operating system. Then, install it.

### Download and setup app

Download the app .zip and unzip it. With it unzipped navigate to the unzipped folder using the terminal or command line.

******Script to install things and set it up.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm run build`

Builds the React app and places it in the /build folder. Open to /build/index.html to quickly examine the built version in the browser.

### `npm pack-macos`

Packages the built React app into a MacOS app, placing it in the /dist/CSCRM-darwin-x64 folder with the name CSCRM.app.

Make sure to run `npm run build` prior to running this script.

To change the name of the app, see the "scripts": {"pack-macos"} and change "CSCRM" to the desired app name.

### `npm pack-win`

Packages the built React app into a Windows exe, placing it in the /dist/CSCRM-win32-x64 folder with the name CSCRM.exe.

Make sure to run `npm run build` prior to running this script.

If developing, or building, on MacOS, install [Wine](https://www.davidbaumgold.com/tutorials/wine-mac/).

To change the name of the app, see the "scripts": {"pack-win"} and change "CSCRM" to the desired app name.