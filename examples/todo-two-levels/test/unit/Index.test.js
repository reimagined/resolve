import React from 'react'
import renderer from 'react-test-renderer'
import { StaticRouter } from 'react-router'

import { Index } from '../../client/containers/Index'

test('renders correctly', () => {
  const tree = renderer
    .create(
      <StaticRouter location="/" context={{}}>
        <Index
          lists={[
            { id: 'id1', title: 'title1' },
            { id: 'id2', title: 'title2' }
          ]}
          createList={() => {}}
          removeList={() => {}}
        />
      </StaticRouter>
    )
    .toJSON()
  expect(tree).toMatchSnapshot()
})
