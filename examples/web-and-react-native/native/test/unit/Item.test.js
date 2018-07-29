import React from 'react'
import Item from '../../client/components/Item'

import renderer from 'react-test-renderer'

it('renders correctly', () => {
  const removeItem = () => {}
  const toggleItem = () => {}

  expect(
    renderer
      .create(
        <Item
          checked={true}
          text="text"
          removeItem={removeItem}
          toggleItem={toggleItem}
        />
      )
      .toJSON()
  ).toMatchSnapshot()

  expect(
    renderer
      .create(
        <Item
          checked={false}
          text="text"
          removeItem={removeItem}
          toggleItem={toggleItem}
        />
      )
      .toJSON()
  ).toMatchSnapshot()
})
