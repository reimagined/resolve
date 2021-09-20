import rootPath from '$resolve.rootPath'
import staticPath from '$resolve.staticPath'
import viewModels from '$resolve.viewModels'
import readModels from '$resolve.readModels'
import aggregates from '$resolve.aggregates'
import subscribeAdapter from '$resolve.subscribeAdapter'

document.addEventListener('DOMContentLoaded', function () {
  document.body.innerHTML = JSON.stringify({
    rootPath,
    staticPath,
    viewModels,
    readModels,
    aggregates,
    subscribeAdapter,
  })
})
