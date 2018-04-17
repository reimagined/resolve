import React from 'react'
import { connectReadModel } from 'resolve-redux'

const pager = ({ count, page, setPage, limit }) => (
  <nav>
    {Array.from(
      new Array(Number.isInteger(count) && count > 0 ? +count : 0)
    ).map((_, idx) => (
      <button
        onClick={idx !== page ? setPage.bind(null, idx) : undefined}
        style={idx !== page ? {} : { fontWeight: 'bold' }}
        key={`BT${idx}`}
      >
        {`${+(limit * idx) + 1} - ${limit * (idx + 1)}`}
      </button>
    ))}
  </nav>
)

const getReadModel = (state, modelName, resolverName) => {
  try {
    return state.readModels[modelName][resolverName]
  } catch (err) {
    return null
  }
}

const FilledItemsPager = connectReadModel(
  (state, { limit, page, setPage }) => ({
    readModelName: 'Rating',
    resolverName: 'PagesCount',
    parameters: { limit: limit },
    isReactive: true,
    count: getReadModel(state, 'Rating', 'PagesCount'),
    page,
    setPage
  })
)(pager)

class ItemsPager extends React.Component {
  render() {
    return (
      <div>
        <FilledItemsPager
          limit={this.props.count}
          page={this.props.page}
          setPage={this.props.setPage}
        />
      </div>
    )
  }
}

export default ItemsPager
