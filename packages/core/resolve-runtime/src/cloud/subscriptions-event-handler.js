// import debugLevels from 'resolve-debug-levels'
// import jwt from 'jsonwebtoken'

// const log = debugLevels('resolve:resolve-runtime:subscriptions-event-handler')

const handleSubscriptionsEvent = async (params, resolve) => {
  const viewModel = resolve.viewModels.find(
    vw => vw.name === params.viewModelName
  )

  if (viewModel == null) {
    throw new Error('View models is not found')
  }

  return viewModel.resolvers.verify({ resolve }, params)
}

export default handleSubscriptionsEvent
