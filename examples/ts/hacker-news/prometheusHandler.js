const prometheusHandler = (req, res) => {
  const {resolve: { monitoring } } = req

  const metrics = monitoring.getMetrics()
  const prometheusMetrics = []

  if (!metrics.metrics.length) {
    console.log('metrics has null')
  }

  // console.log('req 0', Object.getOwnPropertyDescriptors(req))
  // console.log('req 1', Object.getOwnPropertyDescriptors(req.__proto__))
  console.log('metrics.metrics', metrics.metrics)

  for (const metric of metrics) {
    const { metricName, dimensions } = metric
    const tempMetricName = `resolve_command_execution_${metricName.toLowerCase()}`
    const dimensionsList = dimensions.map(({ name, value }) => `${name}="${value}"`).join(', ')
    prometheusMetrics.push(`${tempMetricName}{${dimensionsList}}`)
  }

  Object.defineProperty(res, 'prometheusMetrics', {
    value: prometheusMetrics,
    enumerable: true
  })
  console.log('prometheusMetrics', prometheusMetrics)
  // res.prometheusMetrics = prometheusMetrics
  // api_http_requests_total{method="POST", handler="/messages"}
}

export default prometheusHandler
