import React, { useEffect } from 'react'
import {
  useReduxViewModel,
  useReduxReadModel,
  useReduxCommand,
  useReduxViewModelSelector,
  useReduxReadModelSelector,
} from '@resolve-js/redux'

const NamedSelectors = ({
  match: {
    params: { userId },
  },
}) => {
  const selectorId = 'cumulative-likes-named-selector'

  const { connect, dispose } = useReduxViewModel(
    {
      name: 'cumulative-likes',
      aggregateIds: [userId],
      args: {},
    },
    { selectorId }
  )

  const { request } = useReduxReadModel(
    {
      name: 'users',
      resolver: 'profile',
      args: {
        userId,
      },
    },
    {
      userId,
      profile: {
        name: 'unknown user',
      },
    },
    {
      selectorId: 'user-selector',
    }
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

  const {
    data: { likes },
  } = useReduxViewModelSelector(selectorId)

  const {
    data: { profile: userProfile },
  } = useReduxReadModelSelector('user-selector')

  return (
    <div>
      <button onClick={register}>Register</button>
      <button onClick={like}>Like</button>
      <button onClick={request}>Profile</button>
      <div id="likeCounter">{likes}</div>
      <div id="userName">{userProfile.name}</div>
    </div>
  )
}

export { NamedSelectors }
