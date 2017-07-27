import actions, { FETCH_MORE } from './actions';
import checkRequiredFields from './warn_util';

export default params => store => next => (action) => {
    const { type, readModelName, query } = action;
    if (type === FETCH_MORE && checkRequiredFields({ readModelName, query }, 'Fetch more error:')) {
        params.fetchMore(readModelName, query).then((state) => {
            const mergeAction = actions.merge(readModelName, state);
            store.dispatch(mergeAction);
        });
    }
    return next(action);
};
