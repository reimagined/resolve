import fetch from 'isomorphic-fetch'

import { getRootableUrl } from './util'

export default async function loadInitialState(viewModelName, aggregateId) {
  const response = await fetch(
    getRootableUrl(
      `/api/query/${viewModelName}?aggregateIds=${
        aggregateId === '*' ? '*' : JSON.stringify(aggregateId)
      }`
    ),
    {
      method: 'GET',
      credentials: 'same-origin'
    }
  )

  if (!response.ok) {
    throw new Error(response.text())
  }

  return await response.json()
}
