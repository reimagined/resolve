const fs = require('fs')
const path = require('path')

const { start, end, isSucceeded } = require('minimist')(process.argv.slice(2))

if (start) {
  fs.writeFileSync(path.join(__dirname, '..', 'job.success'), 'false', {
    encoding: 'utf-8'
  })
  fs.writeFileSync(
    path.join(__dirname, '..', 'job.startTime'),
    String(Date.now()),
    { encoding: 'utf-8' }
  )
} else if (end) {
  fs.writeFileSync(path.join(__dirname, '..', 'job.success'), 'true', {
    encoding: 'utf-8'
  })
} else if (isSucceeded) {
  const success = fs
    .readFileSync(path.join(__dirname, '..', 'job.success'), {
      encoding: 'utf-8'
    })
    .toString('utf-8')

  const startTime = +fs
    .readFileSync(path.join(__dirname, '..', 'job.startTime'), {
      encoding: 'utf-8'
    })
    .toString('utf-8')

  const date = new Date(Date.now() - startTime)
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const seconds = date.getUTCSeconds()
  const timeArray = []
  if (hours > 0) {
    timeArray.push(String(hours).padStart(2, '0'))
  }
  timeArray.push(String(minutes).padStart(2, '0'))
  timeArray.push(String(seconds).padStart(2, '0'))
  const time = timeArray.join(':')

  fs.writeFileSync(path.join(__dirname, '..', 'job.time'), String(time), {
    encoding: 'utf-8'
  })

  if (success === 'true') {
    console.log(true)
  } else {
    console.log(false)
  }
}
