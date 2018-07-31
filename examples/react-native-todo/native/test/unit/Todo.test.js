import React from 'react'
import Todo from '../../client/components/Todo'

import { shallow } from 'enzyme'

it('renders correctly', () => {
  const removeItem = () => {}
  const toggleItem = () => {}

  expect(
    shallow(
      <Todo
        checked={true}
        text="text"
        removeItem={removeItem}
        toggleItem={toggleItem}
      />
    )
  ).toMatchSnapshot()

  expect(
    shallow(
      <Todo
        checked={false}
        text="text"
        removeItem={removeItem}
        toggleItem={toggleItem}
      />
    )
  ).toMatchSnapshot()
})
