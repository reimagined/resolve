import actions from './index';

describe('todo actions', () => {
  it('setVisibilityFilter should create SET_VISIBILITY_FILTER action', () => {
    expect(actions.setVisibilityFilter('all')).toEqual({
      type: 'SET_VISIBILITY_FILTER',
      filter: 'all'
    });
  });
});
