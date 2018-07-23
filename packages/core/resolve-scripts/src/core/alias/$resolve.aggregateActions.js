export default () => {
  const exports = []

  exports.push(
    `import { createActions } from 'resolve-redux'`,
    `import aggregates from '$resolve.aggregates'`,
    ``,
    `const actions = {}`,
    `for(const aggregate of aggregates) {`,
    `  Object.assign(actions, createActions(aggregate))`,
    `}`,
    ``,
    `export default actions`
  )

  return {
    code: exports.join('\r\n')
  }
}
