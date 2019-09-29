## NIST Cyber Supply Chain Risk Management (C-SCRM) Interdependency Tool

The NIST Cyber Supply Chain Risk Management (C-SCRM) Interdependency Tool is a prototype tool designed to provide a basic measurement of the potential impact of a cyber supply chain event. The tool is not intended to measure the risk of an event, where risk is defined as a function of threat, vulnerability, likelihood, and impact. Research has found that most of the existing cybersecurity risk tools and research focused on threats, vulnerabilities, and likelihood, but that impact was frequently overlooked. Thus, this tool is intended to bridge that gap and enable users to develop a more complete understanding of their organization’s risk by focusing on impact.

The tool will also provide the user greater visibility over the supply chain and the relative importance of particular projects, products, and suppliers (hereafter “nodes”) compared to others. This can be determined by examining the metrics which contribute to a node’s importance such as amount of access a node has to the acquirer’s IT network, physical facilities and data. By understanding which nodes are the most important in their organization’s supply chain, the user can begin to understand the potential impact a disruption of that node may cause on business operations. The user could then prioritize the completion of risk mitigating actions to reduce the impact a disruption would cause to the organization’s supply chain and overall business.

## Target Platforms

The tool has been run and tested on MacOS and Windows. It has also been run on the Ubuntu distribution of Linux. The tool should run on other Linux distributions, but this has not been attempted.

## Requirements

The development and build process can be run on Mac OSX or Linux. Building on Windows has not been attempted. You will need at least 4GB of memory to run the development environment or to build the application.

Signing of the Mac OSX application will need to be done on a Mac. Signing of the Windows app should be possible on Mac or Linux, but has not been attempted.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Setup and Installation

Download the project, setup tool dependencies, and make sure to run `npm install`

### Install Tool Dependencies

Node, wait-on, [Wine](https://www.davidbaumgold.com/tutorials/wine-mac/), fakeboot, dpkg

#### Node.js

Go to the [Node.js download site](https://nodejs.org/en/download/) and download a version of the installer for your operating system. C-SCRM 1.0.0 was built using v10.16.3. Then, install it.

#### wait-on

Install [wait-on](https://www.npmjs.com/package/wait-on) with `npm install wait-on -g`. You will likely need to do this as super-user (e.g. use `sudo`). This is only for running a development environment.

#### Wine

A dependency when building the windows executable on Mac and Linux. To install on Mac, presuming [Homebrew](https://brew.sh/) is installed, run `brew install wine`. For Ubuntu Linux, run `sudo apt install wine-stable`. Check wine documentation and versions here: [wine site](https://www.davidbaumgold.com/tutorials/wine-mac/)

#### fakeboot

This will need to be installed when creating the Linux Debian installer on the Mac. To install on Mac, presuming [Homebrew](https://brew.sh/) is installed, run `brew install fakeroot`. For more information, visit the documentation for [electron-installer-debian](https://www.npmjs.com/package/electron-installer-debian).

#### dpkg

This will need to be installed when creating the Linux Debian installer on the Mac. To install on Mac, presuming [Homebrew](https://brew.sh/) is installed, run `brew install dpkg`. For more information, visit the documentation for [electron-installer-debian](https://www.npmjs.com/package/electron-installer-debian).

## Develop and Build Applications/Installers

In the project directory, you can run `npm install` and then the following scripts will be run depending on need.

### `npm start`

Runs the app in the development mode. This will open a Chromium window.

The page will reload if you make edits. You will also see any warnings and errors in the console.

### `npm run build`

Builds the React app and places it in the /build folder.

### _Creating the App for MacOS_

#### `npm run pack-macos`

Packages the built React app into a MacOS app, placing it in the /dist/C-SCRM-darwin-x64 folder with the name C-SCRM.app.

Make sure to run `npm run build` prior to running this script.

#### `npm run sign-macos`

This can only be run on Mac OSX. It will sign the Mac version of the packaged app with the value of the environment variable `OSX_SIGN_IDENTITY`. Typically this would be run as follows: `OSX_SIGN_IDENTITY=<certificate name> npm run sign-macos`.

#### `npm run create-installer-mac`

Create a DMG installer for the Mac app. C-SCRM.dmg will be placed in the /dist/C-SCRM-darwin-x64 folder. App should be packaged and signed before this step.

### _Creating the App for Windows_

#### `npm run pack-win`

Packages the built React app into a Windows exe, placing it in the /dist/C-SCRM-win32-x64 folder with the name C-SCRM.exe.

Make sure to run `npm run build` prior to running this script.

If developing or building on MacOS or Linux install [Wine](https://www.davidbaumgold.com/tutorials/wine-mac/).

#### `npm run create-installer-win`

Create a Windows installer executable. C-SCRM-Installer.exe will be placed in the /dist/C-SCRM-win32-x64 folder. The app should be packaged before this step.

### _Creating the App for Linux (Ubuntu)_

#### `npm run pack-linux`

Packages the built React app into Linux executable, placing it in the /dist/C-SCRM-linux-x64 folder with the name C-SCRM.exe.

Make sure to run `npm run build` prior to running this script.

#### `npm run create-installer-debian`

Creates a debian installer package for Linux, placing it in the dist/C-SCRM-linux-x64 folder with the name c-scrm_1.0.0_amd64.deb. You will need `fakeroot` and `dpkg` installed if running on the Mac (see above). The app should be packaged first.
