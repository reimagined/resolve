import React from 'react'
import { Redirect } from 'react-router-dom'
import { Story } from '../containers/Story'
import { Pagination } from './Pagination'
import { ITEMS_PER_PAGE } from '../constants'
const Stories = ({ items, page, type }) => {
  if (items === null || (page && !Number.isInteger(Number(page)))) {
    return React.createElement(Redirect, {
      push: true,
      to: '/error?text=No such page',
    })
  }
  const start = +(ITEMS_PER_PAGE * (page ? page - 1 : 0)) + 1
  return React.createElement(
    'div',
    null,
    items.slice(0, ITEMS_PER_PAGE).map((story, index) =>
      React.createElement(Story, {
        key: story.id,
        index: start + index,
        story: story,
      })
    ),
    React.createElement(Pagination, {
      page: page,
      hasNext: !!items[ITEMS_PER_PAGE],
      location: `/${type}`,
    })
  )
}
export { Stories }
