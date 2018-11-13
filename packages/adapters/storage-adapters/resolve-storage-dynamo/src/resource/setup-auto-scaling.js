import { rangedIndex } from '../constants'

const setupAutoScaling = async (pool, tableName) => {
  const { setupAutoScalingItem } = pool

  const read = setupAutoScalingItem(
    pool,
    `table/${tableName}`,
    'dynamodb:table:ReadCapacityUnits',
    `${tableName}-readpolicy`,
    'DynamoDBReadCapacityUtilization'
  )

  const write = setupAutoScalingItem(
    pool,
    `table/${tableName}`,
    'dynamodb:table:WriteCapacityUnits',
    `${tableName}-writepolicy`,
    'DynamoDBWriteCapacityUtilization'
  )

  const indexRead = setupAutoScalingItem(
    pool,
    `table/${tableName}/index/${rangedIndex}`,
    'dynamodb:index:ReadCapacityUnits',
    `${tableName}-indexreadpolicy`,
    'DynamoDBReadCapacityUtilization'
  )

  const indexWrite = setupAutoScalingItem(
    pool,
    `table/${tableName}/index/${rangedIndex}`,
    'dynamodb:index:WriteCapacityUnits',
    `${tableName}-indexwritepolicy`,
    'DynamoDBWriteCapacityUtilization'
  )

  await Promise.all([read, write, indexRead, indexWrite])
}

export default setupAutoScaling
