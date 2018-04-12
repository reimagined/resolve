import React from 'react'
import { connectReadModel } from 'resolve-redux'

import Stories from '../components/Stories'
import { ITEMS_PER_PAGE } from '../constants'

const AskByPage = ({
  match: {
    params: { page }
  },
  data: { stories = [], me }
}) => <Stories items={stories} page={page} type="ask" userId={me && me.id} />

const getReadModelData = state => {
  try {
    return {
      stories: state.readModels['default']['askStories'].stories,
      me: state.readModels['default']['askStories'].me
    }
  } catch (err) {
    return { stories: [], me: null }
  }
}

export default connectReadModel((state, { match: { params: { page } } }) => ({
  readModelName: 'default',
  resolverName: 'askStories',
  variables: {
    offset: ITEMS_PER_PAGE + 1,
    first: (+page - 1) * ITEMS_PER_PAGE
  },
  data: getReadModelData(state),
  page
}))(AskByPage)
