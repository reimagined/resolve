const loadViewModelInitialState = async (
  origin,
  rootPath,
  viewModelName,
  aggregateId
) => {
  const response = await fetch(
    `${origin}${rootPath}/api/query/${viewModelName}?aggregateIds${
      aggregateId === '*' ? '' : '[]'
    }=${aggregateId}`,
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

export default loadViewModelInitialState
