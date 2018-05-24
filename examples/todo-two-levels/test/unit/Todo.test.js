import React from 'react';
import renderer from 'react-test-renderer';
import { StaticRouter } from 'react-router';

import { Todo } from '../../client/containers/Todo';

test('renders correctly', () => {
  const tree = renderer
    .create(
      <StaticRouter location="/id1" context={{}}>
        <Todo
          todos={{
            id1: {
              text: 'text1',
              checked: true
            },
            id2: {
              text: 'text2',
              checked: false
            }
          }}
          createItem={() => {}}
          toggleItem={() => {}}
          removeItem={() => {}}
          aggregateId={() => {}}
        />
      </StaticRouter>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
