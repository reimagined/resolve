const s3Server = require('s3rver')

const launchMode = process.argv[2]
let server = null

const start = () => {
  server = new s3Server({
    port: 3001,
    hostname: 'localhost',
    silent: false,
    directory: './base',
    // configureBuckets: [{ name: 'bucket' }],
    allowMismatchedSignatures: true
  }).run(error => {
    error ? console.log(error) : console.log('Server started')
  })
}

const stop = () => {
  server.close(error => {
    error ? console.log(error) : console.log('Server stopped')
  })
}

void (async () => {
  switch (launchMode) {
    case 'start': {
      start()
      break
    }

    case 'stop': {
      stop()
      break
    }
  }
})()
