import React from 'react'
import renderer from 'react-test-renderer'

import { Todos } from '../../client/containers/Todos'

test('renders correctly', () => {
  const tree = renderer
    .create(
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
    )
    .toJSON()
  expect(tree).toMatchSnapshot()
})
