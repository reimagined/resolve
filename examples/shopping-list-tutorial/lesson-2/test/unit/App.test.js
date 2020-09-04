import React from 'react'
import renderer from 'react-test-renderer'

import App from '../../client/containers/App'

test('renders correctly', () => {
  const tree = renderer.create(<App />).toJSON()

  expect(tree).toMatchSnapshot()
})
