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

  const time = Math.round((Date.now() - startTime) / 1000)

  fs.writeFileSync(path.join(__dirname, '..', 'job.time'), String(time), {
    encoding: 'utf-8'
  })

  if (success === 'true') {
    console.log(true)
  } else {
    console.log(false)
  }
}
