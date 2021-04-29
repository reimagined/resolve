import sendAnalytics from '../src/send-analytics'
import { analyticsUrlBase, resolveVersion } from '../src/constants'
import { get } from 'https'
jest.mock('https')

test('sendAnalytics requests correct analytics url', () => {
  const exampleName = 'hacker-news'
  sendAnalytics(exampleName)
  expect(get).toBeCalledTimes(1)
  expect(get.mock.calls[0][0]).toEqual(
    `${analyticsUrlBase}/${exampleName}/${resolveVersion}`
  )
})
