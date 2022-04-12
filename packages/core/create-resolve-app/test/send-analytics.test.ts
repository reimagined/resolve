import sendAnalytics from '../src/send-analytics'
import { analyticsUrlBase, resolveVersion } from '../src/constants'
import { get } from 'https'
import { mocked } from 'jest-mock'
jest.mock('https')

const mockedGet = mocked(get)

test('sendAnalytics requests correct analytics url', () => {
  const exampleName = 'hacker-news'
  sendAnalytics(exampleName)
  expect(get).toBeCalledTimes(1)
  expect(mockedGet.mock.calls[0][0]).toEqual(
    `${analyticsUrlBase}/${exampleName}/${resolveVersion}`
  )
})
