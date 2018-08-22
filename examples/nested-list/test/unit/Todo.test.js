import React from 'react'
import renderer from 'react-test-renderer'
import { StaticRouter } from 'react-router'

import { Todos } from '../../client/containers/Todos'

test('renders correctly', () => {
  const tree = renderer
    .create(
      <StaticRouter location="/id1" context={{}}>
        <Todos
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
    .toJSON()
  expect(tree).toMatchSnapshot()
})
