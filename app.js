"use strict";

var app = require("electron").app;
var BrowserWindow = require("electron").BrowserWindow;
const { Notification } = require("electron");

const { Menu, Tray } = require("electron");
var ipc = require("electron").ipcMain;
//var os = require("os");
//var { dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const Store = require("electron-store");
var CryptoJS = require("crypto-js");

let store = null;
let mainWindow = null;
let tray = null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    console.log("Already running...");

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    showNotification();
  });

  // Create myWindow, load the rest of the app, etc...
  // app.on("ready", () => {});
}

ipc.handle("get-version", (event, arg) => {
  return app.getVersion();
});

ipc.handle("get-store", (event, arg) => {
  console.log(arg);
  return store.get(arg);
});

ipc.on("set-store", (event, arg) => {
  store.set(arg.key, arg.value);
});

function showNotification() {
  const notification = {
    title: "Vaccinator",
    body: "Vaccinator already running",
    icon: "icon.png",
  };
  new Notification(notification).show();
}

function showAbout() {
  app.setAboutPanelOptions({
    applicationName: "About Vaccinator",
    applicationVersion: app.getVersion(),
    copyright: "RA",
    authors: ["RA"],
    iconPath: path.join(__dirname, "icon.png"),
  });
  app.showAboutPanel();
}
function createWindow() {
  autoUpdater.checkForUpdatesAndNotify();

  let win = new BrowserWindow({
    width: 400,
    height: 600,
    autoHideMenuBar: true,
    frame: false,
    resizable: false,
    center: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "icon.png"),
  });

  win.loadFile("index.html");
  win.on("closed", function () {
    mainWindow = null;
  });

  let tray = null;
  win.on("minimize", function (event) {
    event.preventDefault();
    win.setSkipTaskbar(true);
    tray = createTray();
  });

  win.on("restore", function (event) {
    win.show();
    win.setSkipTaskbar(false);
    tray.destroy();
  });

  return win;
}

function createTray() {
  let appIcon = new Tray(path.join(__dirname, "icon.png"));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show",
      click: function () {
        mainWindow.show();
      },
    },
    {
      label: "Exit",
      click: function () {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  appIcon.on("double-click", function (event) {
    mainWindow.show();
  });
  appIcon.setToolTip("Vaccinator");
  appIcon.setContextMenu(contextMenu);
  return appIcon;
}

app.whenReady().then(() => {
  mainWindow = createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  app.setAppUserModelId("in.iocare.vaccinator");
  store = new Store();
  var hash = CryptoJS.SHA256("842737");
  //var hex = hash.toString(SHA256.enc.Hex);
  console.log(hash.toString());
});

app.setLoginItemSettings({
  openAtLogin: true,
  path: app.getPath("exe"),
});

ipc.on("window-status", (event, arg) => {
  if (arg === "about") {
    showAbout();
  }
  if (arg === "running") {
    showNotification();
  }
  if (arg === "show") {
    mainWindow.show();
  }
  if (arg === "minimise") {
    mainWindow.minimize();
  }
  if (arg === "maximize") {
    if (!mainWindow.isMaximized()) {
      mainWindow.maximize();
      return null;
    }
    mainWindow.unmaximize();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
