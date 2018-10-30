const interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault')

module.exports.aggregates = interopRequireDefault(require('$resolve.aggregates')).default
module.exports.viewModels = interopRequireDefault(require('$resolve.viewModels')).default
module.exports.readModels = interopRequireDefault(require('$resolve.readModels')).default
module.exports.rootPath = interopRequireDefault(require('$resolve.rootPath')).default
module.exports.staticPath = interopRequireDefault(require('$resolve.staticPath')).default
module.exports.jwtCookie = interopRequireDefault(require('$resolve.jwtCookie')).default
module.exports.applicationName = interopRequireDefault(require('$resolve.applicationName')).default
module.exports.subscribeAdapter = interopRequireDefault(require('$resolve.subscribeAdapter')).default
module.exports.origin = interopRequireDefault(require('./origin')).default
