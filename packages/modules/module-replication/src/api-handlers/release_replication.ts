import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'
import respondWithError from './respond-with-error'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  try {
    await req.resolve.eventstoreAdapter.setReplicationLock(0)
    res.status(200)
    res.end()
  } catch (error) {
    respondWithError('release', res, error)
  }
}

export default handler
