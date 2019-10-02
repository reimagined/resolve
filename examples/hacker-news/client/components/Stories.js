import React from 'react'
import { Redirect } from 'react-router-dom'

import Story from '../containers/Story'
import Pagination from './Pagination'
import { ITEMS_PER_PAGE } from '../constants'

const Stories = ({
  isLoading,
  items,
  page,
  type,
  userId,
  upvoteStory,
  unvoteStory
}) => {
  if (isLoading !== false) {
    return null
  }

  if (items === null || (page && !Number.isInteger(Number(page)))) {
    return <Redirect push to="/error?text=No such page" />
  }

  const start = +(ITEMS_PER_PAGE * (page ? page - 1 : 0)) + 1

  return (
    <div>
      {items.slice(0, ITEMS_PER_PAGE).map((story, index) => (
        <Story
          key={story.id}
          index={start + index}
          story={story}
          userId={userId}
          upvoteStory={upvoteStory}
          unvoteStory={unvoteStory}
        />
      ))}
      <Pagination
        page={page}
        hasNext={!!items[ITEMS_PER_PAGE]}
        location={`/${type}`}
      />
    </div>
  )
}

export default Stories
