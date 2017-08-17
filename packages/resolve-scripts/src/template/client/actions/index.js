import { createActions } from 'resolve-redux';
import todoAggregate from '../../common/aggregates/todo';

export default createActions(todoAggregate, {
  setVisibilityFilter: filter => ({
    type: 'SET_VISIBILITY_FILTER',
    filter
  })
});
