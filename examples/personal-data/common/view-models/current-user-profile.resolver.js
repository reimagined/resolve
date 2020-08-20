import jwt from 'jsonwebtoken'
import jwtSecret from '../../auth/jwt-secret'

export default async (
  resolve,
  { eventTypes, aggregateIds },
  { jwt: token, viewModel }
) => {
  try {
    jwt.verify(token, jwtSecret)
  } catch (error) {
    throw new Error('Permission denied')
  }

  const { data, cursor } = await resolve.buildViewModel(viewModel.name, {
    eventTypes,
    aggregateIds
  })

  return {
    data,
    meta: {
      cursor,
      eventTypes,
      aggregateIds
    }
  }
}
