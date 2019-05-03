This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Setup

Download the project, setup dependencies, and make sure to run `npm install`

### Install dependencies

Node, electron-packager, wait-on, [Wine](https://www.davidbaumgold.com/tutorials/wine-mac/)

#### Node.js

Go to the [Node.js download site](https://nodejs.org/en/download/) and download the installer for your operating system. Then, install it.

#### electron-packager

Install [electron-packager](https://github.com/electron-userland/electron-packager) with `npm install electron-packager -g`

#### wait-on
Install [wait-on](https://www.npmjs.com/package/wait-on) with `npm install wait-on -g`. This is only for development.

#### Wine
A dependency when building the windows exe on Mac (and maybe Linux). To install on Mac, presuming [Homebrew](https://brew.sh/) is installed, run `brew install wine`. Check wine documentation and versions here: [wine site](https://www.davidbaumgold.com/tutorials/wine-mac/)

## Available Scripts

In the project directory, you can run `npm install` and then the following scripts will be useful.

### `npm start`

Runs the app in the development mode.<br>
This will open a Chromium window with the Electron app icon unless [otherwise changed](https://www.christianengvall.se/electron-app-icons/).

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm run build`

Builds the React app and places it in the /build folder.

### `npm pack-macos`

Packages the built React app into a MacOS app, placing it in the /dist/CSCRM-darwin-x64 folder with the name CSCRM.app.

**This must be run from a Mac with Xcode Command Line Tools installed. It also signs the code, otherwise users cannot open the app.

Make sure to run `npm run build` prior to running this script.

To change the name of the app, see the "scripts": {"pack-macos"} and change "CSCRM" to the desired app name.

### `npm pack-win`

Packages the built React app into a Windows exe, placing it in the /dist/CSCRM-win32-x64 folder with the name CSCRM.exe.

Make sure to run `npm run build` prior to running this script.

If developing, or building, on MacOS, install [Wine](https://www.davidbaumgold.com/tutorials/wine-mac/).

To change the name of the app, see the "scripts": {"pack-win"} and change "CSCRM" to the desired app name.

### `npm pack-linux`

Packages the built React app into Linux executable, placing it in the /dist/CSCRM-linux-x64 folder with the name CSCRM.exe.

Make sure to run `npm run build` prior to running this script.

To change the name of the app, see the "scripts": {"pack-win"} and change "CSCRM" to the desired app name.