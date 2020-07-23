import qs from 'querystring'

const getSubscribeAdapterOptions = async (
  resolve,
  origin,
  adapterName,
  viewModelName
) => {
  const { RESOLVE_DEPLOYMENT_ID, RESOLVE_WS_URL } = process.env

  const viewModel = resolve.viewModels.find(vw => vw.name === viewModelName)

  if (viewModel == null) {
    throw new Error('View models is not found')
  }

  const token = await viewModel.resolvers.sign()

  const query = qs.stringify({
    jwt: token,
    applicationArn: resolve.subscriptionsCredentials.applicationLambdaArn,
    viewModelName
  })

  const subscribeUrl = `${RESOLVE_WS_URL}?${query}`

  return {
    appId: RESOLVE_DEPLOYMENT_ID,
    url: subscribeUrl
  }
}

export default getSubscribeAdapterOptions
