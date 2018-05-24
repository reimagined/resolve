import React from 'react';
import { shallow } from 'enzyme';

import Splitter from '../../../client/components/Splitter';

it('Splitter renders correctly', () => {
  const wrapper = shallow(<Splitter />);

  expect(wrapper).toMatchSnapshot();
});

it('Splitter white renders correctly', () => {
  const wrapper = shallow(<Splitter color="#fff" />);

  expect(wrapper).toMatchSnapshot();
});
