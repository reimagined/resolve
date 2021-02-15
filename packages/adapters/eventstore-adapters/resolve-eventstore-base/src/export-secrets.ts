import { Readable } from 'stream'

import { BATCH_SIZE } from './constants'

import {
  AdapterPoolConnectedProps,
  AdapterPoolPossiblyUnconnected,
  ExportSecretsOptions,
} from './types'

type ExportStreamContext = {
  pool: any
  idx: ExportSecretsOptions['idx']
}

async function* generator(
  context: ExportStreamContext
): AsyncGenerator<Buffer, void> {
  const { pool }: any = context

  await pool.waitConnect()

  while (true) {
    const { secrets, idx }: any = await pool.loadSecrets({
      idx: context.idx,
      limit: BATCH_SIZE,
    })

    for (const secret of secrets) {
      const chunk: Buffer = Buffer.from(JSON.stringify(secret) + '\n', 'utf8')

      yield chunk
      context.idx = idx
    }
    if (secrets.length === 0) {
      return
    }
  }
}

const exportSecretsStream = <ConnectedProps extends AdapterPoolConnectedProps>(
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  { idx = null }: Partial<ExportSecretsOptions> = {}
): Readable => {
  if (pool.loadSecrets === undefined)
    throw new Error('loadSecrets is not defined for this adapter')

  const context: ExportStreamContext = {
    pool,
    idx,
  }

  const stream: Readable = Readable.from(generator(context))
  Object.defineProperty(stream, 'idx', {
    get() {
      return context.idx
    },
  })

  return stream
}

export default exportSecretsStream
