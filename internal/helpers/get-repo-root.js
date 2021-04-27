const path = require('path')

const getRepoRoot = () => path.resolve(__dirname, '..', '..')

module.exports = {
  getRepoRoot,
}
