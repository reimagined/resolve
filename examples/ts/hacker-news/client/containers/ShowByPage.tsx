import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { ResultStatus, useReduxReadModel } from '@resolve-js/redux'

import { Stories } from '../components/Stories'
import { ITEMS_PER_PAGE } from '../constants'

const ShowByPage = () => {
  let { page = '1' } = useParams<'page'>()

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
    status === ResultStatus.Initial && status === ResultStatus.Requested

  return !isLoading ? <Stories items={stories} page={page} type="show" /> : null
}

export { ShowByPage }
