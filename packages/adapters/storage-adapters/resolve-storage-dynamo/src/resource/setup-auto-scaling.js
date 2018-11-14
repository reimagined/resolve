import { rangedIndex } from '../constants'

const setupAutoScaling = async (pool, { region, tableName }) => {
  const { setupAutoScalingItem, ApplicationAutoScaling } = pool

  const applicationAutoScaling = new ApplicationAutoScaling({ region })

  const read = setupAutoScalingItem(
    applicationAutoScaling,
    `table/${tableName}`,
    'dynamodb:table:ReadCapacityUnits',
    `${tableName}-readpolicy`,
    'DynamoDBReadCapacityUtilization'
  )

  const write = setupAutoScalingItem(
    applicationAutoScaling,
    `table/${tableName}`,
    'dynamodb:table:WriteCapacityUnits',
    `${tableName}-writepolicy`,
    'DynamoDBWriteCapacityUtilization'
  )

  const indexRead = setupAutoScalingItem(
    applicationAutoScaling,
    `table/${tableName}/index/${rangedIndex}`,
    'dynamodb:index:ReadCapacityUnits',
    `${tableName}-indexreadpolicy`,
    'DynamoDBReadCapacityUtilization'
  )

  const indexWrite = setupAutoScalingItem(
    applicationAutoScaling,
    `table/${tableName}/index/${rangedIndex}`,
    'dynamodb:index:WriteCapacityUnits',
    `${tableName}-indexwritepolicy`,
    'DynamoDBWriteCapacityUtilization'
  )

  await Promise.all([read, write, indexRead, indexWrite])
}

export default setupAutoScaling
