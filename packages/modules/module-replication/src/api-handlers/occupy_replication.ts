import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'
import respondWithError from './respond-with-error'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  const occupyInfo = req.body == null ? null : JSON.parse(req.body.toString())
  if (occupyInfo == null || typeof occupyInfo.lockId !== 'string') {
    res.status(400)
    res.end('Expected lockId')
    return
  }

  const duration = +occupyInfo.duration
  if (isNaN(duration) || duration <= 0) {
    res.status(400)
    res.end('Invalid duration provided')
    return
  }
  try {
    const success = await req.resolve.eventstoreAdapter.setReplicationLock(
      occupyInfo.lockId,
      duration
    )
    if (success) {
      res.status(200)
      res.end()
    } else {
      res.status(409)
      res.end('Replicator already occupied')
    }
  } catch (error) {
    respondWithError('occupy', res, error)
  }
}

export default handler
