import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useReduxReadModel } from '@resolve-js/redux'
import { Story } from './Story'
const ConnectedStory = ({ id }) => {
  const refreshId = useSelector((state) => state.optimistic.refreshId)
  const { request: getStory, selector } = useReduxReadModel(
    {
      name: 'HackerNews',
      resolver: 'story',
      args: {
        refreshId,
        id,
      },
    },
    null,
    []
  )
  const { data: story } = useSelector(selector)
  useEffect(() => {
    getStory()
  }, [getStory])
  return <Story showText story={story} />
}
export { ConnectedStory }
