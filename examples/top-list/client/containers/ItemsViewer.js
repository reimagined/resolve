import React from 'react'
import { connectReadModel } from 'resolve-redux'

import { ListGroup, ListGroupItem } from 'react-bootstrap'

const viewer = ({ items, page, limit }) => {
  let listItems = []

  for (let i = 0; i < limit; i++) {
    let item = items && items[i]
    listItems.push(
      <ListGroupItem className="example-list" key={`LI-${page}-${i}`}>
        <div className="example-list-place">{+(limit * page) + i + 1}</div>
        <div className="example-list-name">{item ? item.name : ''}</div>
        <div className="example-list-votes">
          {item ? item.rating : ''} votes
        </div>
      </ListGroupItem>
    )
  }

  return <ListGroup key={`SC-${page}`}>{listItems}</ListGroup>
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
