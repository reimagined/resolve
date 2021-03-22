import fetch from 'isomorphic-fetch'

export const handler = async ({ url }) => {
  const response = await fetch(`${url}/event-store/unfreeze`)
  const result = await response.text()

  //eslint-disable-next-line no-console
  console.log(result)
}

export const command = 'unfreeze'
export const describe = 'unfreeze eventstore'
