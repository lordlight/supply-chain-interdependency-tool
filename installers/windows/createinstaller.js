const createWindowsInstaller = require("electron-winstaller")
  .createWindowsInstaller;
const path = require("path");

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch(error => {
    console.error(error.message || error);
    process.exit(1);
  });

function getInstallerConfig() {
  console.log("creating windows installer");
  const rootPath = path.join("./");
  const outPath = path.join(rootPath, "dist");

  return Promise.resolve({
    appDirectory: path.join(outPath, "C-SCRM-win32-x64/"),
    authors: "NIST",
    noMsi: true,
    outputDirectory: path.join(outPath, "C-SCRM-win32-x64"),
    exe: "C-SCRM.exe",
    setupExe: "C-SCRM-Installer.exe",
    description:
      "Cyber Supply Chain Risk Management (C-SCRM) Interdependency Tool",
    setupIcon: path.join(rootPath, "assets", "icons", "win", "cscrm.ico"),
    loadingGif: path.join(
      rootPath,
      "assets",
      "loading",
      "win",
      "cscrm-loading.gif"
    )
  });
}
