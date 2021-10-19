import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ResultStatus, useReduxReadModel } from '@resolve-js/redux'
import { Stories } from '../components/Stories'
import { ITEMS_PER_PAGE } from '../constants'
const NewestByPage = ({
  match: {
    params: { page },
  },
}) => {
  const { request: getStories, selector } = useReduxReadModel(
    {
      name: 'HackerNews',
      resolver: 'allStories',
      args: {
        offset: ITEMS_PER_PAGE + 1,
        first: (+page - 1) * ITEMS_PER_PAGE,
      },
    },
    [],
    [page]
  )
  const { data: stories, status } = useSelector(selector) || {
    data: [],
    status: ResultStatus.Initial,
  }
  useEffect(() => {
    getStories()
  }, [page])
  const isLoading =
    status === ResultStatus.Initial || status === ResultStatus.Requested
  return !isLoading ? (
    <Stories items={stories} page={page} type="newest" />
  ) : null
}
export { NewestByPage }
