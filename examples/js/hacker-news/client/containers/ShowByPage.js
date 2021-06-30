import React, { useEffect } from 'react'
import { ResultStatus, useReduxReadModel } from '@resolve-js/redux'
import { useSelector } from 'react-redux'
import { Stories } from '../components/Stories'
import { ITEMS_PER_PAGE } from '../constants'
const ShowByPage = ({
  match: {
    params: { page },
  },
}) => {
  const { request: getStories, selector } = useReduxReadModel(
    {
      name: 'HackerNews',
      resolver: 'showStories',
      args: {
        offset: ITEMS_PER_PAGE + 1,
        first: (+page - 1) * ITEMS_PER_PAGE,
      },
    },
    [],
    []
  )
  const { data: stories, status } = useSelector(selector)
  useEffect(() => {
    getStories()
  }, [getStories])
  const isLoading =
    status === ResultStatus.Initial && status === ResultStatus.Requested
  return !isLoading ? <Stories items={stories} page={page} type="show" /> : null
}
export { ShowByPage }
