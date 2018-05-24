import getSourceInfo from './get_source_info';
import println from './println';

const raiseError = (errorText, errorObject) => {
  const errorSource =
    typeof errorObject !== 'undefined' ? getSourceInfo(errorObject) : '';
  println.error('Error: ', errorText, ' ', errorSource);
  process.exit(1);
};

export default raiseError;
