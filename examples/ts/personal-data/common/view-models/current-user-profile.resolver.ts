import jwt from 'jsonwebtoken'
import { ViewModelResolver } from '@resolve-js/core'
import jwtSecret from '../../auth/jwt-secret'

const resolver: ViewModelResolver = async (
  resolve,
  query,
  { jwt: token, viewModel }
) => {
  try {
    jwt.verify(token, jwtSecret)
  } catch (error) {
    throw new Error('Permission denied')
  }

  const { data, cursor } = await resolve.buildViewModel(viewModel.name, query)

  return {
    data,
    meta: {
      cursor,
      eventTypes: viewModel.eventTypes,
      aggregateIds: query.aggregateIds,
    },
  }
}

export default resolver
