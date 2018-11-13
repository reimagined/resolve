const setupAutoScalingItem = async (
  { ApplicationAutoScaling },
  resourceId,
  dimension,
  policyName,
  metricType
) => {
  await ApplicationAutoScaling.registerScalableTarget({
    ResourceId: resourceId,
    ServiceNamespace: 'dynamodb',
    ScalableDimension: dimension,
    MinCapacity: 5,
    MaxCapacity: 25
  }).promise()

  await ApplicationAutoScaling.putScalingPolicy({
    PolicyName: policyName,
    ResourceId: resourceId,
    ServiceNamespace: 'dynamodb',
    ScalableDimension: dimension,
    PolicyType: 'TargetTrackingScaling',
    TargetTrackingScalingPolicyConfiguration: {
      TargetValue: 50.0,
      PredefinedMetricSpecification: {
        PredefinedMetricType: metricType
      },
      ScaleOutCooldown: 60,
      ScaleInCooldown: 60
    }
  }).promise()
}

export default setupAutoScalingItem
