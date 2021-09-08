import { mocked } from 'ts-jest/utils'
import { backgroundJob } from '../../../src/common/utils/background-job'
import { getLog } from '../../../src/common/utils/get-log'

jest.mock('../../../src/common/utils/get-log', () => {
  const log = {
    warn: jest.fn(),
  }

  return {
    getLog: () => log,
  }
})

const log = getLog('')
const mLogWarn = mocked(log.warn)

afterEach(() => {
  mLogWarn.mockClear()
})

test('delayed execution', async () => {
  let result: string | undefined = undefined
  const operation = (arg: string) => {
    result = arg
  }

  const worker = backgroundJob(operation)
  expect(result).toBeUndefined()

  await worker('success')
  expect(result).toBeUndefined()

  await new Promise((resolve) => {
    setTimeout(resolve, 1)
  })
  expect(result).toEqual('success')
})

test('background fault tolerance', async () => {
  const operation = () => {
    throw Error('unexpected job error')
  }

  const worker = backgroundJob(operation)
  await worker()
  await new Promise((resolve) => {
    setTimeout(resolve, 1)
  })
  expect(mLogWarn).toHaveBeenCalledTimes(1)
})
