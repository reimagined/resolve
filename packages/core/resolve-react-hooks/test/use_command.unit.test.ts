import { mocked } from 'ts-jest/utils'
import { getApi } from 'resolve-client'
import { useCommand } from '../src/use_command'
import { ResolveContext } from '../src/context'

jest.mock('resolve-api')
const mockedGetApi = mocked(getApi)

const clearMocks = () => {
  mockedGetApi.mockClear()
}

test('client requested for specified context', () => {

})

test('command object as input', () => {

})
