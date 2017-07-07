import actions, { FETCH_MORE } from './actions';
import checkRequiredFields from './warn_util';

export default params => store => next => (action) => {
    const { type, projectionName, query } = action;
    if (
        type === FETCH_MORE &&
        checkRequiredFields({ projectionName, query }, 'Fetch more error:')
    ) {
        params.fetchMore(projectionName, query).then((state) => {
            const mergeAction = actions.merge(projectionName, state);
            store.dispatch(mergeAction);
        });
    }
    return next(action);
};
