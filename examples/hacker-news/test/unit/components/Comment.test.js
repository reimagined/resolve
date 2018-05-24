import React from 'react';
import { shallow } from 'enzyme';

import Comment from '../../../client/components/Comment';

let originalNow = Date.now;

beforeAll(() => {
  Date.now = () => new Date(2017, 9, 30, 8, 0).getTime();
});

afterAll(() => {
  Date.now = originalNow;
});

it('Comment Level 0 renders correctly', () => {
  const markup = shallow(
    <Comment
      id="SomeId"
      level={0}
      text="SomeContent"
      createdBy="SomeUser"
      createdAt={0}
      storyId="story-id"
      parentId="story-id"
      root={{ id: 'SomeId', title: 'SomeTitle' }}
    />
  );

  expect(markup).toMatchSnapshot();
});

it('Comment Level 1 renders correctly', () => {
  const markup = shallow(
    <Comment
      id="SomeId"
      level={1}
      text="SomeContent"
      createdBy="SomeUser"
      createdAt={0}
      storyId="story-id"
      parentId="parent-id"
      root={{ id: 'SomeId', title: 'SomeTitle' }}
    />
  );

  expect(markup).toMatchSnapshot();
});

it('Comment Level 20 renders correctly', () => {
  const markup = shallow(
    <Comment
      id="SomeId"
      level={20}
      text="SomeContent"
      createdBy="SomeUser"
      createdAt={0}
      storyId="story-id"
      parentId="parent-id"
    />
  );

  expect(markup).toMatchSnapshot();
});

it('Comment Level 20 renders correctly', () => {
  const markup = shallow(
    <Comment
      id="SomeId"
      level={20}
      text="SomeContent"
      createdBy="SomeUser"
      createdAt={0}
      storyId="story-id"
      parentId="parent-id"
    />
  );

  expect(markup).toMatchSnapshot();
});

it('Comment with state.expanded=false renders correctly', () => {
  const markup = shallow(
    <Comment
      id="SomeId"
      level={1}
      text="SomeContent"
      createdBy="SomeUser"
      createdAt={0}
      storyId="story-id"
      parentId="parent-id"
    />
  );
  markup.instance().expand();

  expect(markup).toMatchSnapshot();
});

it('Comment without childrens renders correctly', () => {
  const markup = shallow(
    <Comment
      id="SomeId"
      level={1}
      text="SomeContent"
      createdBy="SomeUser"
      createdAt={0}
      storyId="story-id"
      parentId="parent-id"
    />
  );

  expect(markup).toMatchSnapshot();
});

it('Invalid comment renders correctly', () => {
  const markup = shallow(<Comment />);

  expect(markup).toMatchSnapshot();
});
