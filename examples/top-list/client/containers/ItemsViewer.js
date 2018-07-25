import React from 'react'
import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'
import { ListGroup, ListGroupItem } from 'react-bootstrap'

const ItemsViewer = ({ items, page, limit }) => {
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

const mapStateToOptions = (state, { limit, page }) => {
  return {
    readModelName: 'Rating',
    resolverName: 'TopRating',
    resolverArgs: { page, limit },
    isReactive: false
  }
}

const mapStateToProps = (state, { data, page }) => {
  return {
    items: data,
    page
  }
}

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps)(ItemsViewer)
)
