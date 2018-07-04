import React from 'react'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'

import { ButtonToolbar, ToggleButtonGroup, ToggleButton } from 'react-bootstrap'

const Pager = ({ count, page, setPage, limit }) => {
  const rowLength = 5

  let firstRow = []
  let secondRow = []
  let length = Number.isInteger(count) && count > 0 ? +count : 0

  for (let i = 0; i < length; i++) {
    const row = i >= rowLength ? secondRow : firstRow
    row.push(
      <ToggleButton
        className="page-button"
        onClick={i !== page ? setPage.bind(null, i) : undefined}
        value={i}
        key={`BT${i}`}
      >
        {`${+(limit * i) + 1} - ${limit * (i + 1)}`}
      </ToggleButton>
    )
  }

  return (
    <div>
      <ButtonToolbar>
        <ToggleButtonGroup
          justified
          type="radio"
          name="firstRow"
          value={page}
          onChange={() => {}}
        >
          {firstRow}
        </ToggleButtonGroup>

        <ToggleButtonGroup
          justified
          type="radio"
          name="secondRow"
          value={page}
          onChange={() => {}}
        >
          {secondRow}
        </ToggleButtonGroup>
      </ButtonToolbar>
    </div>
  )
}

const mapStateToOptions = (state, { limit }) => {
  return {
    readModelName: 'Rating',
    resolverName: 'PagesCount',
    resolverArgs: { limit },
    isReactive: true
  }
}

const mapStateToProps = (state, { data, page, setPage }) => {
  return {
    count: data,
    page,
    setPage
  }
}

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps)(Pager)
)
