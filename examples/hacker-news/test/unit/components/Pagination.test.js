import React from 'react'
import { shallow } from 'enzyme'

import Pagination, { StyledLink } from '../../../client/components/Pagination'

it('Page 1 renders correctly', () => {
  const markup = shallow(
    <Pagination page={1} hasNext={false} location="news" />
  )

  expect(markup).toMatchSnapshot()
})

it('Page 2 renders correctly', () => {
  const markup = shallow(<Pagination page={2} hasNext={true} location="news" />)

  expect(markup).toMatchSnapshot()
})

it('Page 3 renders correctly', () => {
  const markup = shallow(
    <Pagination page={3} hasNext={false} location="news" />
  )

  expect(markup).toMatchSnapshot()
})

it('Page Default renders correctly', () => {
  const markup = shallow(<Pagination hasNext={false} location="news" />)

  expect(markup).toMatchSnapshot()
})

it('Page 1 renders correctly', () => {
  const markup = shallow(<Pagination hasNext={true} location="news" />)

  expect(markup).toMatchSnapshot()
})

it('Page 1 renders correctly', () => {
  const markup = shallow(<Pagination hasNext={true} location="news" />)

  expect(markup).toMatchSnapshot()
})

it('Href renders correctly', () => {
  const markup = shallow(<StyledLink to="/" />)

  expect(markup).toMatchSnapshot()
})

it('Href { disabled: true } renders correctly', () => {
  const markup = shallow(<StyledLink to="/" disabled />)

  expect(markup).toMatchSnapshot()
})
