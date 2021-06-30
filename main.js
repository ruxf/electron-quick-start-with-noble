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
  ipcMain.on('noble-start', () => {
    noble.startScanning()
  })
  noble.on('stateChange', (state) => {
    console.log('State: ', state)
  })
  noble.on('scanStart', (result) => {
    console.log('Scan start: \n', result)
  })
  
  noble.on('scanStop', (error) => {
    if (error) {
      console.log('Scan error: \n', error)
    }
  })
  
  noble.on('stateChange', (state) => {
    console.log('State change: \n', state)
    if (state === 'poweredOn') {
      noble.startScanning([REALTIME_SERVICE_UUID, CHECKUP_SERVICE_UUID, BACKUP_SERVICE_UUID], false, (error) => {
        if (error) {
          return console.error(error)
        }
      })
    }
  })
  
  noble.on('discover', (peripheral) => {
    noble.stopScanning()
    console.log('Discover: \n', peripheral)
    onConnectAndNotify(peripheral)
  })
  
  noble.on('warning', (result) => {
    console.log('Warning: \n', result)
  })
  function onConnectAndNotify(peripheral) {
    peripheral.connect((error) => {
      if (error) console.log(error)
    })
    peripheral.once('connect', (error) => {
      if (error) {
        return console.log('Connect error: \n', error)
      }
  
      const services = [REALTIME_SERVICE_UUID, CHECKUP_SERVICE_UUID, BACKUP_SERVICE_UUID]
      const characteristics = [
        REALTIME_CHARACTERISTIC_READ_UUID,
        REALTIME_CHARACTERISTIC_WRITE_UUID,
        CHECKUP_CHARACTERISTIC_READ_UUID,
        CHECKUP_CHARACTERISTIC_WRITE_UUID,
        BACKUP_CHARACTERISTIC_READ_UUID,
        BACKUP_CHARACTERISTIC_WRITE_UUID
      ]
  
      peripheral.discoverSomeServicesAndCharacteristics(services, characteristics, onServicesAndCharacteristicsDiscovered)
    })
  }
  
  function onServicesAndCharacteristicsDiscovered(error, services,  characteristics) {
    const [, write, read, , insert, backup] = characteristics
    let total = 0
    read.on('data', (data) => {
      total += 1
      if (total > 262) {
        return read.unsubscribe()
      }
      if (total === 262) {
        upload()
        return write.write(Buffer.from([0x02]))
      }
      onResolveData(data)
    })
    read.subscribe((error) => {
      if (error) {
        return console.error(error)
      }
      console.log('等待数据通知')
    })
    write.write(Buffer.from([0x01]))
    
    const checkup = []
    let counter = 1
    function onResolveData(data) {
      const buffer = Buffer.from(data)
      const [sequence] = buffer
      validate(sequence, counter++)
      // console.log('Receive: ', Buffer.from(data).toString('hex'))
      console.log('Receive: ', buffer)
      if (total % 9 === 0) {
        return checkup.push(buffer.slice(0, 17).toString('hex'))
      }
      checkup.push(buffer.toString('hex'))
    }
    
    function validate(sequence, counter) {
      console.log(sequence)
      console.log(counter)
      if (sequence === counter) return;
      const missed = sequence - counter
      for (let i = 0; i < missed; i ++) {
        checkup.push('')
        backup.write(Buffer.from([counter + i]))
      }
      insert.subscribe((error) => {
        if (error) {
          console.error(error)
        }
      })
      insert.on('data', (data) => {
        const buffer = Buffer.from(data)
        const [sequence] = buffer
        checkup.splice(sequence, sequence + 1, buffer.toString('hex'))
      })
    }
    function upload() {
      console.log('Upload start:')
      console.log(checkup)
    }
  }  
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
