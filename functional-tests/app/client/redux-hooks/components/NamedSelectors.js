import React, { useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import {
  useReduxViewModel,
  useReduxCommand,
  useReduxViewModelSelector,
  useReduxReadModel,
  useReduxReadModelSelector,
} from 'resolve-redux'

export default () => {
  const { request } = useReduxReadModel(
    {
      name: 'users',
      resolver: 'all',
      args: {},
    },
    [],
    {
      selectorId: 'cumulative-likes-named-selector',
    },
  )

  const {
    data: users,
  } = useReduxReadModelSelector('cumulative-likes-named-selector')

  return (
    <div>
      <button onClick={request}>Get users</button>
      <div>
        {users.map(user => (<div>user.name</div>))}
      </div>
    </div>
  )
}
