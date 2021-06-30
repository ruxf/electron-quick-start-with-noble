// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const noble = window.noble
const Buffer = window.buffer.Buffer
console.log(Buffer)

const REALTIME_SERVICE_UUID = '6e400001b5a3f393e0a9e50e24dcca9e'
const REALTIME_CHARACTERISTIC_READ_UUID = '6e400003b5a3f393e0a9e50e24dcca9e'
const REALTIME_CHARACTERISTIC_WRITE_UUID = '6e400002b5a3f393e0a9e50e24dcca9e'
const CHECKUP_SERVICE_UUID = '6e400004b5a3f393e0a9e50e24dcca9e'
const CHECKUP_CHARACTERISTIC_READ_UUID = '6e400006b5a3f393e0a9e50e24dcca9e'
const CHECKUP_CHARACTERISTIC_WRITE_UUID = '6e400005b5a3f393e0a9e50e24dcca9e'
const BACKUP_SERVICE_UUID = '6e40000ab5a3f393e0a9e50e24dcca9e'
const BACKUP_CHARACTERISTIC_READ_UUID = '6e40000cb5a3f393e0a9e50e24dcca9e'
const BACKUP_CHARACTERISTIC_WRITE_UUID = '6e40000bb5a3f393e0a9e50e24dcca9e'
noble.startScanning([REALTIME_SERVICE_UUID, CHECKUP_SERVICE_UUID, BACKUP_SERVICE_UUID], false, (error) => {
  if (error) {
    return console.error(error)
  }
})

// noble.startScanning()

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
    checkup.push(buffer.slice(1))
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
      checkup.splice(sequence, sequence + 1, buffer.slice(1))
    })
  }
  function upload() {
    console.log('Upload start:')
    console.log(checkup)
    const data = checkup.reduce((map, item) => {
      for (let value of item.values()) {
        map.push(value.toString(16))
      }
      return map
    }, [])
    console.log(data.join(' '))
  }
}
