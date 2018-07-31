import React from 'react'
import { Todos } from '../../client/containers/Todos'

import renderer from 'react-test-renderer'

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
    renderer
      .create(
        <Todos
          todos={todos}
          createItem={createItem}
          removeItem={removeItem}
          toggleItem={toggleItem}
        />
      )
      .toJSON()
  ).toMatchSnapshot()
})
