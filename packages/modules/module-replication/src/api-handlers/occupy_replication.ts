import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  const duration = +req.query.duration
  if (isNaN(duration) || duration <= 0) {
    res.status(400)
    res.end('Invalid duration provided')
    return
  }
  const success = await req.resolve.eventstoreAdapter.setReplicationLock(
    duration
  )
  if (success) {
    res.status(200)
    res.end()
  } else {
    res.status(409)
    res.end('Replicator already occupied')
  }
}

export default handler
