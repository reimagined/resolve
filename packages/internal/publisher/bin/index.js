const { patch } = require('@internal/helpers')

const version = process.argv.slice(2)[0]

patch(version)