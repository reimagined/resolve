import React from 'react'
import renderer from 'react-test-renderer'

import { ShoppingList } from '../../client/containers/ShoppingList'

test('renders correctly', () => {
  const tree = renderer
    .create(
      <ShoppingList
        renameShoppingList={() => {}}
        removeShoppingList={() => {}}
        toggleShoppingItem={() => {}}
        createShoppingItem={() => {}}
        removeShoppingItem={() => {}}
        isLoading={false}
        data={{
          id: 'shopping-list-1',
          name: 'List 1',
          list: [
            {
              id: '1',
              text: 'Milk',
              checked: false
            },
            {
              id: '2',
              text: 'Eggs',
              checked: false
            },
            {
              id: '3',
              text: 'Canned beans',
              checked: false
            },
            {
              id: '4',
              text: 'Paper towels',
              checked: false
            }
          ]
        }}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
