import React from 'react'
import { connectReadModel } from 'resolve-redux'

const viewer = ({ items, page, limit }) => {
  let articles = []

  for (let i = 0; i < limit; i++) {
    let item = items && items[i]
    articles.push(
      <article key={`LI-${page}-${i}`}>
        <b>{+(limit * page) + i + 1}</b>: {item ? item.name : ''} ({item
          ? item.rating
          : ''}{' '}
        votes)
      </article>
    )
  }

  return <section key={`SC-${page}`}>{articles}</section>
}

const getReadModel = (state, modelName, resolverName) => {
  try {
    return state.readModels[modelName][resolverName]
  } catch (err) {
    return null
  }
}

const FilledItemsViewer = connectReadModel((state, { limit, page }) => ({
  readModelName: 'Rating',
  resolverName: 'TopRating',
  parameters: { page, limit: limit },
  isReactive: true,
  items: getReadModel(state, 'Rating', 'TopRating'),
  page
}))(viewer)

class ItemsViewer extends React.Component {
  render() {
    return (
      <div>
        <FilledItemsViewer limit={this.props.count} page={this.props.page} />
      </div>
    )
  }
}

export default ItemsViewer
