import grpc from 'grpc'
import * as protoLoader from '@grpc/proto-loader'
import fetch from 'isomorphic-fetch'

async function executeCommand(
  { resolveHost, resolvePort, resolveRootPath },
  { request },
  callback
) {
  try {
    const req = await fetch(
      `http://${resolveHost}:${resolvePort}${resolveRootPath}/api/commands`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: request.type,
          aggregateId: request.aggregateId,
          aggregateName: request.aggregateName,
          payload: JSON.parse(request.payload)
        })
      }
    )
    if(!req.ok) {
      throw new Error(await req.text())
    }
    const event = await req.json()

    callback(null, { error: null, event: { ...event, payload: JSON.stringify(event.payload) } })
  } catch (error) {
    callback(null, {
      error: {
        code: Number(error.code),
        message: String(error.message),
        stack: String(error.stack)
      },
      event: null
    })
  }
}

async function runServer({
  grpcHost,
  grpcPort,
  resolveHost,
  resolvePort,
  resolveRootPath
}) {
  return new Promise((resolve, reject) => {
    const pool = {
      grpcHost,
      grpcPort,
      resolveHost,
      resolvePort,
      resolveRootPath
    }
    const PROTO_PATH = `${__dirname}/resolve.proto`
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    })
    const definition = grpc.loadPackageDefinition(packageDefinition).resolve

    pool.server = new grpc.Server()
    pool.server.addService(definition.Resolve.service, {
      executeCommand: executeCommand.bind(null, pool)
    })

    pool.server.bindAsync(
      `${grpcHost}:${grpcPort}`,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => (!error ? resolve(port) : reject(error))
    )

    pool.server.start()
  })
}

export default runServer
