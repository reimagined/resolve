import { Readable } from 'stream'

import { BATCH_SIZE, MAINTENANCE_MODE_AUTO } from './constants'
import { AlreadyFrozenError, AlreadyUnfrozenError } from './frozen-errors'

import { AdapterBoundPool, ExportSecretsOptions } from './types'

type Context<ConfiguredProps extends {}> = {
  pool: AdapterBoundPool<ConfiguredProps>
  idx: ExportSecretsOptions['idx']
  maintenanceMode: ExportSecretsOptions['maintenanceMode']
}

async function startProcessSecrets<ConfiguredProps extends {}>({
  pool,
  maintenanceMode,
}: Context<ConfiguredProps>): Promise<void> {
  if (maintenanceMode === MAINTENANCE_MODE_AUTO) {
    try {
      await pool.freeze()
    } catch (error) {
      if (!AlreadyFrozenError.is(error)) {
        throw error
      }
    }
  }
}

async function endProcessSecrets<ConfiguredProps extends {}>({
  pool,
  maintenanceMode,
}: Context<ConfiguredProps>): Promise<void> {
  if (maintenanceMode === MAINTENANCE_MODE_AUTO) {
    try {
      await pool.unfreeze()
    } catch (error) {
      if (!AlreadyUnfrozenError.is(error)) {
        throw error
      }
    }
  }
}

async function* generator<ConfiguredProps extends {}>(
  context: Context<ConfiguredProps>
): AsyncGenerator<Buffer, void> {
  const { pool }: any = context

  await startProcessSecrets(context)

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
      await endProcessSecrets(context)
      return
    }
  }
}

const exportSecretsStream = <ConfiguredProps extends {}>(
  pool: AdapterBoundPool<ConfiguredProps>,
  {
    idx = null,
    maintenanceMode = MAINTENANCE_MODE_AUTO,
  }: Partial<ExportSecretsOptions> = {}
): Readable => {
  if (pool.loadSecrets === undefined)
    throw new Error('loadSecrets is not defined for this adapter')

  const context: Context<ConfiguredProps> = {
    pool,
    idx,
    maintenanceMode,
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
