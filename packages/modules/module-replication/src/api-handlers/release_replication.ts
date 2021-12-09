import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'
import respondWithError from './respond-with-error'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  try {
    const releaseInfo = JSON.parse(req.body ?? '')
    if (releaseInfo == null || typeof releaseInfo.lockId !== 'string') {
      res.status(400)
      res.end('Expected lockId')
      return
    }
    await req.resolve.eventstoreAdapter.setReplicationLock(
      releaseInfo.lockId,
      0
    )
    res.status(200)
    res.end()
  } catch (error) {
    respondWithError('release', res, error)
  }
}

export default handler
