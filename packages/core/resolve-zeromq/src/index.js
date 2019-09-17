let resolveZmq

try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  resolveZmq = require('../optional/dependencies/zeromq')
} catch (error) {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    resolveZmq = require('../optional/dependencies/zeromq-ng/compat')
  } catch (error) {
    resolveZmq = {
      socket() {
        throw new Error('Zeromq is not installed')
      }
    }
  }
}

module.exports = resolveZmq
