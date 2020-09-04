export default (store) => (next) => (action): any => store && next(action);
