import React from 'react'
import renderer from 'react-test-renderer'

import PostCSS from '../../client/components/PostCSS'

test('renders correctly', () => {
  const tree = renderer.create(<PostCSS />).toJSON()
  expect(tree).toMatchSnapshot()
})
