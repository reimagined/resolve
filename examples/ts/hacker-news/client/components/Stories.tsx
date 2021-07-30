import React from 'react'
import { Redirect } from 'react-router-dom'

import { Story } from '../containers/Story'
import { Pagination } from './Pagination'
import { ITEMS_PER_PAGE } from '../constants'

type StoriesProps = { items: any[]; page: number; type: string }

const Stories = ({ items = [], page, type }: StoriesProps) => {
  if (items === null || (page && !Number.isInteger(Number(page)))) {
    return <Redirect push to="/error?text=No such page" />
  }

  const start = +(ITEMS_PER_PAGE * (page ? page - 1 : 0)) + 1

  return (
    <div>
      {items.slice(0, ITEMS_PER_PAGE).map((story, index) => (
        <Story key={story.id} index={start + index} story={story} />
      ))}
      <Pagination
        page={page}
        hasNext={!!items[ITEMS_PER_PAGE]}
        location={`/${type}`}
      />
    </div>
  )
}

export { Stories }
