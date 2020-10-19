import React, { useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import {
  useReduxViewModel,
  useReduxCommand,
  useReduxViewModelSelector,
} from 'resolve-redux'

export default () => {
  const userId = uuid()

  const { connect, dispose } = useReduxViewModel(
    {
      name: 'cumulative-likes',
      aggregateIds: [userId],
      args: {},
    },
    {
      selectorId: 'cumulative-likes-named-selector',
    }
  )

  const { execute: register } = useReduxCommand({
    type: 'register',
    aggregateName: 'user',
    aggregateId: userId,
    payload: {
      name: 'John Smith',
    },
  })

  const { execute: like } = useReduxCommand({
    type: 'like',
    aggregateName: 'user',
    aggregateId: userId,
    payload: {},
  })

  const {
    data: { likes },
  } = useReduxViewModelSelector('cumulative-likes-named-selector')

  useEffect(() => {
    connect()
    return dispose
  })

  return (
    <div>
      <button onClick={register}>Register</button>
      <button onClick={like}>Like</button>
      <div id="likeCounter">{likes}</div>
    </div>
  )
}
