import React from 'react'
import { App } from '../../client/containers/App'

import { shallow } from 'enzyme'

it('renders correctly', () => {
  const todos = [
    {
      id: 'id1',
      text: 'text1',
      checked: false
    },
    {
      id: 'id2',
      text: 'text2',
      checked: false
    }
  ]

  const createItem = () => {}
  const removeItem = () => {}
  const toggleItem = () => {}

  expect(
    shallow(
      <App
        todos={todos}
        createItem={createItem}
        removeItem={removeItem}
        toggleItem={toggleItem}
      />
    )
  ).toMatchSnapshot()
})
