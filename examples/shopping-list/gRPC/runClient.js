import uuid from 'uuid/v4'
import grpc from 'grpc'
import * as protoLoader from '@grpc/proto-loader'

async function runClient({ grpcHost, grpcPort }) {
  const PROTO_PATH = __dirname + '/resolve.proto'

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  })
  const resolve = grpc.loadPackageDefinition(packageDefinition).resolve
  const client = new resolve.Resolve(
    `${grpcHost}:${grpcPort}`,
    grpc.credentials.createInsecure()
  )

  const executeCommand = request => {
    return new Promise((resolve, reject) => {
      client.executeCommand(request, (error, response) => {
        !error ? resolve(response) : reject(error)
      })
    })
  }

  const aggregateId = uuid()

  const { error, event } = await executeCommand({
    aggregateName: 'ShoppingList',
    aggregateId,
    type: 'createShoppingList',
    payload: JSON.stringify({ name: `Shopping list ${aggregateId}` })
  })

  if(error != null) {
    const err = new Error()
    Object.assign(err, error)
    throw err
  }
  console.log(event)
}

export default runClient
