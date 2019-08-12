const { getResolveExamples, getResolvePackages } = require('@internal/helpers')

console.log(getResolveExamples({isSupportMonorepo: true, isIncludeDescription: false}))

console.log(getResolvePackages())