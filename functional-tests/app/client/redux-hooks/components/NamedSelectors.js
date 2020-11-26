import React, { useEffect, useMemo } from 'react'
import { v4 as uuid } from 'uuid'
import {
  useReduxViewModel,
  useReduxCommand,
  useReduxViewModelSelector,
} from 'resolve-redux'

const NamedSelectors = () => {
  const userId = useMemo(uuid, [uuid])
  const selectorId = 'cumulative-likes-named-selector'

  const { connect, dispose } = useReduxViewModel(
    {
      name: 'cumulative-likes',
      aggregateIds: [userId],
      args: {},
    },
    { selectorId }
  )

  useEffect(() => {
    connect()
    return dispose
  }, [])

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

  const selectorResult = useReduxViewModelSelector(selectorId)
  if (selectorResult == null) {
    return null
  }
  const {
    data: { likes },
  } = selectorResult

  return (
    <div>
      <button onClick={register}>Register</button>
      <button onClick={like}>Like</button>
      <div id="likeCounter">{likes}</div>
    </div>
  )
}

export { NamedSelectors }
