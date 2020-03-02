## NIST Cyber Supply Chain Risk Management (C-SCRM) Interdependency Tool

The NIST Cyber Supply Chain Risk Management (C-SCRM) Interdependency Tool is a proof-of-concept with sample code designed to provide a basic measurement of the potential impact of a cyber supply chain event. The tool is not intended to measure the risk of an event, where risk is defined as a function of threat, vulnerability, likelihood, and impact. Research has found that most of the existing cybersecurity risk tools and research focused on threats, vulnerabilities, and likelihood, but that impact is frequently overlooked. Thus, this tool is intended to bridge that gap and enable users to develop a more complete understanding of their organization’s risk by focusing on impact.

The tool is also intended to provide the user greater visibility over the supply chain and the relative importance of particular projects, products, and suppliers (hereafter “nodes”) compared to others. This can be determined by examining the metrics which contribute to a node’s importance such as amount of access a node has to the acquirer’s IT network, physical facilities and data. By understanding which nodes are the most important in their organization’s supply chain, the user can begin to understand the potential impact a disruption of that node may cause on business operations. The user could then prioritize the completion of risk mitigating actions to reduce the impact a disruption would cause to the organization’s supply chain and overall business.

Please see Draft NIST IR 8272 (Not yet published) for more information about this prototype tool.

## Target Platforms

The tool has been run and tested on MacOS and Windows. It has also been run on the Ubuntu distribution of Linux. The tool should run on other Linux distributions, but this has not been attempted.

## Requirements

The development and build process can be run on Mac OSX or Linux. Building on Windows has not been attempted. You will need at least 4GB of memory to run the development environment or to build the application.

Signing of the Mac OSX application will need to be done on a Mac. Signing of the Windows app is possible on the Mac. It also can be done on Ubuntu Linux 18.04 LTS, but first you must install the required **libcurl3** package (`sudo apt install libcurl3 libcurl-openssl1.0-dev`). It should also be possible on other Linux releases, but this has not been attempted.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Setup and Installation

Download the project, setup tool dependencies, and make sure to run `npm install`. You should also run `npm dedupe` after the install.

### Install Tool Dependencies

Node, wait-on, [Wine](https://www.davidbaumgold.com/tutorials/wine-mac/), fakeboot, dpkg

#### Node.js

Go to the [Node.js download site](https://nodejs.org/en/download/) and download and install a version of the installer for your operating system. C-SCRM 1.0.0 was built using v10.16.3.

#### wait-on

Install [wait-on](https://www.npmjs.com/package/wait-on) with `npm install wait-on -g`. You will likely need to do this as super-user (e.g. use `sudo`). This is only for running a development environment.

#### Wine

A dependency when building the windows version on Mac and Linux. To install on Mac, presuming [Homebrew](https://brew.sh/) is installed, run `brew install wine`. For Ubuntu Linux, run `sudo apt install wine-stable`. Check wine documentation and versions here: [wine site](https://www.davidbaumgold.com/tutorials/wine-mac/).

#### fakeboot

This will need to be installed when creating the Linux Debian installer on the Mac. To install on Mac, presuming [Homebrew](https://brew.sh/) is installed, run `brew install fakeroot`. For more information, visit the documentation for [electron-installer-debian](https://www.npmjs.com/package/electron-installer-debian).

#### dpkg

This will need to be installed when creating the Linux Debian installer on the Mac. To install on Mac, presuming [Homebrew](https://brew.sh/) is installed, run `brew install dpkg`. For more information, visit the documentation for [electron-installer-debian](https://www.npmjs.com/package/electron-installer-debian).

## Develop and Build Applications/Installers

In the project directory, once you have run `npm install`, the following scripts can be run depending on need.

### `npm start`

Runs the app in the development mode. This will open a Chromium window. The page will reload if you make edits. You will also see any warnings and errors in the console.

### `npm run build`

Builds the React app and places it in the /build folder.

### _Creating the App for MacOS_

#### `npm run pack-macos`

Packages the built React app into a MacOS app, placing it in the **/dist/C-SCRM-darwin-x64** folder with the name **C-SCRM.app**.

Make sure to run `npm run build` prior to running this script.

#### `npm run sign-macos`

This can only be run on Mac OSX. It will sign the Mac version of the packaged app with the value of the environment variable `OSX_SIGN_IDENTITY`. Typically this would be run as follows: `OSX_SIGN_IDENTITY=<certificate name> npm run sign-macos`.

#### `npm run create-installer-mac`

Create a DMG installer for the Mac app. **C-SCRM.dmg** will be placed in the **/dist/installers/mac** folder. App should be packaged and signed before this step.

### _Creating the App for Windows_

#### `npm run create-installer-win`

Packages the built React app into a Windows exe, and creates a Windows installer executable. Note that there is no separate pack step as there is for the other platforms.

Make sure to run `npm run build` prior to running this script. If developing or building on MacOS or Linux install [Wine](https://www.davidbaumgold.com/tutorials/wine-mac/) first.

**C-SCRM-Installer.exe** will be placed in the **/dist/installers/win** folder. The packaged app itself will be in **/dist/installers/win/win-unpacked/C-SCRM.exe**. This script can also sign the application and installer, but package.json must be modified to include the certificate file and password, as shown in this example:

```
  ...
  "build": {
    ...
    "win": {
      "target": [
        "nsis"
      ],
      "icon": "assets/icons/win/cscrm.ico",
      "artifactName": "C-SCRM-Installer.exe",
      "certificateFile": "selfsigncert.pfx",
      "certificatePassword": "passw0rd1"
    }
  },
  ...
```

### _Creating the App for Linux (Ubuntu)_

#### `npm run pack-linux`

Packages the built React app into a Linux executable, placing it in the **/dist/C-SCRM-linux-x64** folder with the name **C-SCRM**.

Make sure to run `npm run build` prior to running this script.

#### `npm run create-installer-debian`

Creates a debian installer package for Linux, placing it in the **dist/installers/debian** folder with the name **c-scrm_1.0.0_amd64.deb**. You will need `fakeroot` and `dpkg` installed if running on the Mac (see above). The app should be packaged first.

#### `npm run create-archive-linux`

Will archive the Linux application package into a tar file, **c-scrm_1.0.0.tar.gz**, which will be located in the folder **dist/archives/linux**.
