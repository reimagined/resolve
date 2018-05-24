import React from 'react';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';

import Story from '../containers/Story';
import Pagination from './Pagination';
import { ITEMS_PER_PAGE } from '../constants';

const StoriesRoot = styled.div`
  padding: 0 0.5em;
`;

const StoryList = 'ol';

const StoryItem = styled.li`
  margin-bottom: 12px;
`;

const Stories = ({ items, page, type, userId }) => {
  if (page && !Number.isInteger(Number(page))) {
    return <Redirect push to="/error?text=No such page" />;
  }

  return (
    <StoriesRoot>
      <StoryList start={+(ITEMS_PER_PAGE * (page ? page - 1 : 0)) + 1}>
        {items.slice(0, ITEMS_PER_PAGE).map(story => (
          <StoryItem key={story.id}>
            <Story story={story} userId={userId} />
          </StoryItem>
        ))}
      </StoryList>
      <Pagination
        page={page}
        hasNext={!!items[ITEMS_PER_PAGE]}
        location={`/${type}`}
      />
    </StoriesRoot>
  );
};

export default Stories;
