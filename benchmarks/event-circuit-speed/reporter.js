import { defaultReporter, prepareCsv } from 'benchmark-base/tools'

export default function reporter(data, writer) {
  return Promise.all([
    defaultReporter(
      data,
      writer,
      info => `<field name="Entities count" value="${info.report.entities}" />`
    ),
    writer(
      './entities-count.csv',
      prepareCsv(data, info => `${info.report.entities}`)
    )
  ])
}
