import jwt from 'jsonwebtoken'

const getSubscribeAdapterOptions = async (
  resolve,
  origin,
  viewModelName,
  topics,
  authToken
) => {
  const {
    RESOLVE_DEPLOYMENT_ID,
    RESOLVE_WS_URL,
    RESOLVE_ENCRYPTED_DEPLOYMENT_ID
  } = process.env

  const viewModel = resolve.viewModels.find(vw => vw.name === viewModelName)

  if (viewModel == null) {
    throw new Error('View model is not found')
  }

  const customTopics = await viewModel.resolver(resolve, {
    topics,
    jwt: authToken
  })

  const token = jwt.sign(
    { topics: customTopics },
    RESOLVE_ENCRYPTED_DEPLOYMENT_ID
  )

  const subscribeUrl = `${RESOLVE_WS_URL}?deploymentId=${RESOLVE_DEPLOYMENT_ID}&token=${token}`

  return {
    appId: RESOLVE_DEPLOYMENT_ID,
    url: subscribeUrl
  }
}

export default getSubscribeAdapterOptions
