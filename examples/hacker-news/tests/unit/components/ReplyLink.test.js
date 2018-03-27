import React from 'react'
import { shallow } from 'enzyme'

import ReplyLink from '../../../client/components/ReplyLink'

it('ReplyLink renders correctly', () => {
  const markup = shallow(
    <ReplyLink storyId={'story-id'} commentId={'comment-id'} />
  )

  expect(markup).toMatchSnapshot()
})
