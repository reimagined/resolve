import React from 'react';
import { shallow } from 'enzyme';

import AuthForm from '../../../client/components/AuthForm';

it('renders correctly', () => {
  const markup = shallow(
    <AuthForm title="Title" action="/auth" buttonText="login" />
  );

  expect(markup).toMatchSnapshot();
});
