import 'regenerator-runtime/runtime';
import makePersistentExecutor from './persistent';
import makeTemporaryExecutor from './temporary';

export default ({ readModel, eventStore }) => {
    return readModel.adapter === 'view'
        ? makeTemporaryExecutor(readModel, eventStore)
        : makePersistentExecutor(readModel, eventStore);
};
