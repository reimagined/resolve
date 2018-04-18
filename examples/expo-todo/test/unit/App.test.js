import React from 'react'
import renderer from 'react-test-renderer'

import { App } from '../../client/containers/App'

test('renders correctly', () => {
  const tree = renderer
    .create(
      <App
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
