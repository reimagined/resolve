import React from 'react'
import { shallow } from 'enzyme'

import Error from '../../../client/components/Error'

it('renders correctly', () => {
  const markup = shallow(<Error location={{ search: '?text=SomeText' }} />)

  expect(markup).toMatchSnapshot()
})
