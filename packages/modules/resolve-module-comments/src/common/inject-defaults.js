import path from 'path'

import injectDefaultOptions from './inject-default-options'

export default callback => (
  options,
  {
    verifyCommand = path.join(__dirname, './aggregates/verify-command.js'),
    ...imports
  } = {}
) => injectDefaultOptions(callback)(options, { verifyCommand, ...imports })
