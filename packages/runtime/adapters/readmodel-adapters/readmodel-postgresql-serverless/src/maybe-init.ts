import type { MaybeInitMethod } from './types'

const maybeInit: MaybeInitMethod = async (pool) => {
  // Left void intentional
  void pool
}

export default maybeInit
