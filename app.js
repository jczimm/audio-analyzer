var app = require('app'); // Module to control application life.
var BrowserWindow = require('browser-window'); // Module to create native browser window.

var ipc = require('electron').ipcMain;
var dialog = require('dialog');

if (process.env.NODE_ENV === "development") {
    var liveReloadClient = require('electron-connect').client;
}

var fs = require('fs');
var path = require('path');

var tmpDir = path.resolve(__dirname, 'tmp');

// Remove tmp folder
var deleteFolderRecursive;
(deleteFolderRecursive = function deleteFolderRecursive(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file, index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
})(tmpDir);

// Recreate tmp folder
try {
    fs.accessSync(tmpDir, fs.F_OK);
} catch (e) {
    fs.mkdirSync(tmpDir);
}

// Only show application logs.
app.commandLine.appendSwitch('v', -1);
app.commandLine.appendSwitch('vmodule', 'console=0');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    quitApp();
});

ipc.on("window", function(e, command) {
    switch (command) {
        case "close":
            quitApp();
            break;
    }
});

function quitApp() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 450,
        frame: false,
        resizable: false,
        title: "Audio Analyzer for MAV",
        icon: "./assets/win/icon.ico"
    });

    console.log(process.cwd()); // fix gulpfile.js seemingly not exec. "electron app" within src/
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    // If app.js is being run in a development context (e.g. by gulpfile.js)
    if (process.env.NODE_ENV === "development") {

        // make window resizeable (for convenience's sake)
        mainWindow.setResizable(true);
        
        // initialize `mainWindow` with electron-connect (for live reload)
        liveReloadClient.create(mainWindow);

        // open devtools
        mainWindow.openDevTools();
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;

        // Remove tmp folder
        deleteFolderRecursive(tmpDir);

        quitApp();
    });
});
