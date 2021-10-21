import { mockDeep } from 'jest-mock-extended'
import {
  getLog as oGetLog,
  gatherEventListeners as oGatherEventListeners,
  backgroundJob as oBackgroundJob,
  createRuntime as oCreateRuntime,
} from '@resolve-js/runtime-base'
import type { Runtime } from '@resolve-js/runtime-base'

export const getLog = jest.fn(
  (): Partial<ReturnType<typeof oGetLog>> => ({
    log: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    verbose: jest.fn(),
    warn: jest.fn(),
  })
)
export const backgroundJob: typeof oBackgroundJob = jest.fn((job) => job)
export const gatherEventListeners: typeof oGatherEventListeners = jest.fn(
  () => new Map()
)
export const createRuntime: typeof oCreateRuntime = jest.fn(async () =>
  mockDeep<Runtime>()
)
