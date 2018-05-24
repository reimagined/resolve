import React from 'react';
import { connectReadModel } from 'resolve-redux';

import {
  ButtonToolbar,
  ToggleButtonGroup,
  ToggleButton
} from 'react-bootstrap';

const pager = ({ count, page, setPage, limit }) => {
  const rowLength = 5;

  let firstRow = [];
  let secondRow = [];
  let length = Number.isInteger(count) && count > 0 ? +count : 0;

  for (let i = 0; i < length; i++) {
    (i >= rowLength ? secondRow : firstRow).push(
      <ToggleButton
        className="page-button"
        onClick={i !== page ? setPage.bind(null, i) : undefined}
        value={i}
        key={`BT${i}`}
      >
        {`${+(limit * i) + 1} - ${limit * (i + 1)}`}
      </ToggleButton>
    );
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
  );
};

const getReadModel = (state, modelName, resolverName) => {
  try {
    return state.readModels[modelName][resolverName];
  } catch (err) {
    return null;
  }
};

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
)(pager);

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
    );
  }
}

export default ItemsPager;
