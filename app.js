'use strict';
const { app, BrowserWindow, Menu, Tray } = require('electron')
var ipc = require('electron').ipcMain;
var os = require('os');
var {dialog} = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
//const AutoLaunch = require('auto-launch');
let mainWindow;
let tray = null;



function createWindow () {
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    frame:false,
    resizable: false,
    center: true,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
    },
    icon:"icons/playstore.png"
  })

  win.loadFile('index.html');
  win.on('closed', function() {

    mainWindow = null;
  });

  let tray = null;
  win.on('minimize', function (event) {
      event.preventDefault();
      win.setSkipTaskbar(true);
      tray = createTray();
  });

  win.on('restore', function (event) {
      win.show();
      win.setSkipTaskbar(false);
      tray.destroy();
  });


  return win;

}

function createTray() {
  let appIcon = new Tray(path.join(__dirname, "icons/playstore.png"));
  const contextMenu = Menu.buildFromTemplate([
      {
          label: 'Show', click: function () {
              mainWindow.show();
          }
      },
      {
          label: 'Exit', click: function () {
              app.isQuiting = true;
              app.quit();
          }
      }
  ]);

  appIcon.on('double-click', function (event) {
      mainWindow.show();
  });
  appIcon.setToolTip('Vaccinator');
  appIcon.setContextMenu(contextMenu);
  return appIcon;
}

app.whenReady().then(() => {
  mainWindow  = createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

})

app.setLoginItemSettings({
    openAtLogin: true,
    //path: electron.app.getPath("exe")
});

ipc.on('window-status', (event, arg) => {
    //event.sender.send("get-path", FFMPEG_PATH_EXTRACT + "/ffmpeg.exe")
    if (arg==="minimise") {
        mainWindow.minimize();
    }
    if (arg==="maximize") {
        if (!mainWindow.isMaximized()) {
            mainWindow.maximize();
            return null;
           }
        mainWindow.unmaximize();
    }
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})