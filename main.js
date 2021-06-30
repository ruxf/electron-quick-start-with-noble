// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const noble = require('noble')

const REALTIME_SERVICE_UUID = '6e400001b5a3f393e0a9e50e24dcca9e'
const REALTIME_CHARACTERISTIC_READ_UUID = '6e400003b5a3f393e0a9e50e24dcca9e'
const REALTIME_CHARACTERISTIC_WRITE_UUID = '6e400002b5a3f393e0a9e50e24dcca9e'
const CHECKUP_SERVICE_UUID = '6e400004b5a3f393e0a9e50e24dcca9e'
const CHECKUP_CHARACTERISTIC_READ_UUID = '6e400006b5a3f393e0a9e50e24dcca9e'
const CHECKUP_CHARACTERISTIC_WRITE_UUID = '6e400005b5a3f393e0a9e50e24dcca9e'
const BACKUP_SERVICE_UUID = '6e40000ab5a3f393e0a9e50e24dcca9e'
const BACKUP_CHARACTERISTIC_READ_UUID = '6e40000cb5a3f393e0a9e50e24dcca9e'
const BACKUP_CHARACTERISTIC_WRITE_UUID = '6e40000bb5a3f393e0a9e50e24dcca9e'

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow.webContents.openDevTools()

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
