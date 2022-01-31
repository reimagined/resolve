import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { ResultStatus, useReduxReadModel } from '@resolve-js/redux'

import { Stories } from '../components/Stories'
import { ITEMS_PER_PAGE } from '../constants'

const AskByPage = () => {
  let { page = '1' } = useParams<'page'>()

  const { request: getStories, selector } = useReduxReadModel(
    {
      name: 'HackerNews',
      resolver: 'askStories',
      args: {
        offset: ITEMS_PER_PAGE + 1,
        first: (+page - 1) * ITEMS_PER_PAGE,
      },
    },
    null,
    []
  )
  const { data: stories, status } = useSelector(selector)

  useEffect(() => {
    getStories()
  }, [getStories])

  const isLoading =
    status === ResultStatus.Initial || status === ResultStatus.Requested

  return !isLoading ? <Stories items={stories} page={page} type="ask" /> : null
}

export { AskByPage }
