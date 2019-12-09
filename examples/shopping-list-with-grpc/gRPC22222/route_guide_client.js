var PROTO_PATH = __dirname + '/route_guide.proto'

var async = require('async')
var _ = require('lodash')
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
var client = new routeguide.RouteGuide(
  'localhost:50051',
  grpc.credentials.createInsecure()
)

/**
 * Run the getFeature demo. Calls getFeature with a point known to have a
 * feature and a point known not to have a feature.
 * @param {function} callback Called when this demo is complete
 */
function runGetFeature(request) {
  return new Promise((resolve, reject) => {
    client.getFeature(request, (error, response) => {
      !error ? resolve(response) : reject(error)
    })
  })
}

/**
 * Run all of the demos in order
 */
async function main() {
  console.log(
    await Promise.all([
      runGetFeature({ name: 'g1' }),
      runGetFeature({ name: 'g2' })
    ])
  )
}

if (require.main === module) {
  main()
}

exports.runGetFeature = runGetFeature
