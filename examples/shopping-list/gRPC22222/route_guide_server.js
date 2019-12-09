var PROTO_PATH = __dirname + '/route_guide.proto'

var grpc = require('grpc')
var protoLoader = require('@grpc/proto-loader')
var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
})
var routeguide = grpc.loadPackageDefinition(packageDefinition).routeguide

function getFeature({ request }, callback) {
  console.log('!!', request)
  callback(null, { name: request.name + '&&&&' })
}

function getServer() {
  var server = new grpc.Server()
  server.addService(routeguide.RouteGuide.service, {
    getFeature: getFeature
  })
  return server
}

if (require.main === module) {
  var routeServer = getServer()
  routeServer.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure())

  routeServer.start()
}

exports.getServer = getServer
