import fetch from 'isomorphic-fetch'

const READ_MODEL = 'READ_MODEL'
const VIEW_MODEL = 'VIEW_MODEL'
const COMMAND = 'COMMAND'

const invokeDomain = async (baseUrl, invokerJwtToken, args) => {
  let url = baseUrl
  let data = null
  let mode = null

  if (baseUrl.endsWith('/query')) {
    const { modelName, resolverName, aggregateIds } = args
    url = `${url}/${modelName}`
    if (resolverName != null) {
      url = `${url}/${resolverName}`
      data = args.resolverArgs
      mode = READ_MODEL
    } else {
      url = `${url}/${aggregateIds}`
      data = args.aggregateArgs
      mode = VIEW_MODEL
    }
  } else {
    data = args
    mode = COMMAND
  }

  const jwtToken = args.jwtToken != null ? args.jwtToken : invokerJwtToken
  let response = null

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`
      },
      body: JSON.stringify(data)
    })
  } catch (error) {
    throw new Error(`Error fetching ${url}`)
  }

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const contentType = response.headers.get('content-type')
  const result =
    contentType && contentType.indexOf('application/json') !== -1
      ? await response.json()
      : await response.text()

  if (mode === READ_MODEL) {
    return JSON.parse(result)
  } else if (mode === VIEW_MODEL) {
    // TODO: emit deserialize view-model result
    return JSON.parse(result)
  } else {
    return 'OK'
  }
}

export default invokeDomain
