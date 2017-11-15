import 'regenerator-runtime/runtime';
import makePersistentExecutor from './persistent';
import makeTemporaryExecutor from './temporary';

export default ({ readModel, viewModel, eventStore }) => {
    if (readModel && !viewModel) {
        return makePersistentExecutor(readModel, eventStore);
    } else if (viewModel && !readModel) {
        return makeTemporaryExecutor(viewModel, eventStore);
    } else {
        throw new Error('Should choice between read & view model');
    }
};
