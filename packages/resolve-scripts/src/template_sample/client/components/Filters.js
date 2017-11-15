import React from 'react';
import styled from 'styled-components';
import FilterLink from '../containers/FilterLink';

const Filters = styled.p`
    padding: 16px;
    margin: 0;
`;

export default () => (
    <Filters>
        <span>Show:</span>
        <FilterLink filter="SHOW_ALL">All</FilterLink>
        <FilterLink filter="SHOW_ACTIVE">Active</FilterLink>
        <FilterLink filter="SHOW_COMPLETED">Completed</FilterLink>
    </Filters>
);
