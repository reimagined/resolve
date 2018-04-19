const JSON5 = require('json5')
const fs = require('fs')

const config = JSON5.parse(fs.readFileSync('./resolve.template.config.json'))

config.host = process.argv[2] || require('my-local-ip')()

fs.writeFileSync('./resolve.config.json', JSON.stringify(config, null, 4))
