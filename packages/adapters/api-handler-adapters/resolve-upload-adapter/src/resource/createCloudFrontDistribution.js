import CloudFront from 'aws-sdk/clients/cloudfront'
import { differenceWith, isEqual } from 'lodash'

import createS3Bucket from './createS3Bucket'

const getDistributionId = arn => {
  const pattern = /.*\/(.*)$/
  const match = pattern.exec(arn)
  return match[1]
}

const getCloudFrontOriginAccessIdentity = async ({
  accessKeyId,
  secretAccessKey,
  region,
  Comment,
  Marker,
  MaxItems = '200'
}) => {
  console.log('getCloudFrontOriginAccessIdentity')
  const cloudFront = new CloudFront({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    region
  })

  const { CloudFrontOriginAccessIdentityList } = await cloudFront
    .listCloudFrontOriginAccessIdentities({
      Marker,
      MaxItems
    })
    .promise()

  const { IsTruncated, NextMarker, Items } = CloudFrontOriginAccessIdentityList

  const identity = Items.find(item => item.Comment === Comment)

  if (identity != null) {
    return {
      id: identity.Id,
      s3UserId: identity.S3CanonicalUserId
    }
  }

  if (IsTruncated) {
    return getCloudFrontOriginAccessIdentity({
      accessKeyId,
      secretAccessKey,
      region,
      Comment,
      Marker: NextMarker
    })
  }

  return null
}

const ensureOriginAccessIdentity = async ({
  accessKeyId,
  secretAccessKey,
  region,
  stage
}) => {
  console.log('ensureOriginAccessIdentity')

  const cloudFront = new CloudFront({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    region
  })
  const comment = `resolve-uploader-${stage}`

  let identity = await getCloudFrontOriginAccessIdentity({
    accessKeyId,
    secretAccessKey,
    region,
    Comment: comment
  })

  if (!identity) {
    const {
      CloudFrontOriginAccessIdentity: { Id, S3CanonicalUserId }
    } = await cloudFront
      .createCloudFrontOriginAccessIdentity({
        CloudFrontOriginAccessIdentityConfig: {
          CallerReference: comment,
          Comment: comment
        }
      })
      .promise()

    identity = { id: Id, s3UserId: S3CanonicalUserId }
  }
  return identity
}

const getCloudFrontDistributionArnByTags = async (
  cf,
  tagFilter,
  marker = null
) => {
  console.log('getCloudFrontDistributionArnByTags')

  const {
    DistributionList: { NextMarker, Items, IsTruncated }
  } = await cf.listDistributions(marker ? { Marker: marker } : {}).promise()

  const taggedResources = []
  for (const { ARN: arn } of Items) {
    const {
      Tags: { Items: tags }
    } = await cf.listTagsForResource({ Resource: arn }).promise()

    taggedResources.push({
      arn,
      tags
    })
  }

  const resource = taggedResources.find(
    ({ tags }) => differenceWith(tagFilter, tags, isEqual).length === 0
  )

  if (resource) {
    return resource.arn
  }
  if (IsTruncated) {
    return getCloudFrontDistributionArnByTags(cf, tagFilter, NextMarker)
  }
  return null
}

const ensureDistribution = async ({
  accessKeyId,
  secretAccessKey,
  region,
  bucketName,
  domainName,
  domainCertificateArn,
  callerReference,
  originAccessIdentity,
  functionVersionArn,
  tags
}) => {
  console.log('ensureDistribution')

  const originId = `s3-${bucketName}`
  const originDomain = `${bucketName}.s3.amazonaws.com`

  const lambdaAssociations = [
    {
      LambdaFunctionARN: functionVersionArn,
      EventType: 'origin-request',
      IncludeBody: true
    }
  ]

  const forwardHeaders = [
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Accept-Encoding',
    'Accept-Language',
    'Accept',
    'Authorization',
    'Content-Type',
    'Host',
    'Origin',
    'User-Agent'
  ]

  const cloudFront = new CloudFront({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    region
  })

  const distributionConfig = {
    CallerReference: callerReference,
    Comment: callerReference,
    Enabled: true,
    Aliases: {
      Quantity: 1,
      Items: [`uploader.${domainName}`]
    },
    Origins: {
      Quantity: 1,
      Items: [
        {
          Id: originId,
          DomainName: originDomain,
          OriginPath: '',
          S3OriginConfig: {
            OriginAccessIdentity: `origin-access-identity/cloudfront/${originAccessIdentity.id}`
          },
          CustomHeaders: {
            Quantity: 0,
            Items: []
          }
        }
      ]
    },
    Restrictions: {
      GeoRestriction: {
        RestrictionType: 'none',
        Quantity: 0,
        Items: []
      }
    },
    WebACLId: '',
    HttpVersion: 'http2',
    IsIPV6Enabled: true,
    ViewerCertificate: {
      CloudFrontDefaultCertificate: false,
      ACMCertificateArn: domainCertificateArn,
      SSLSupportMethod: 'sni-only',
      MinimumProtocolVersion: 'TLSv1.1_2016'
    },
    DefaultCacheBehavior: {
      TargetOriginId: originId,
      ViewerProtocolPolicy: 'redirect-to-https',
      SmoothStreaming: false,
      MinTTL: 0,
      DefaultTTL: 300,
      MaxTTL: 31536000,
      Compress: true,
      FieldLevelEncryptionId: '',
      TrustedSigners: {
        Enabled: false,
        Quantity: 0
      },
      AllowedMethods: {
        Quantity: 3,
        Items: ['GET', 'HEAD', 'OPTIONS'],
        CachedMethods: {
          Quantity: 2,
          Items: ['GET', 'HEAD']
        }
      },
      ForwardedValues: {
        QueryString: true,
        QueryStringCacheKeys: {
          Quantity: 0,
          Items: []
        },
        Cookies: {
          Forward: 'none'
        },
        Headers: {
          Quantity: forwardHeaders.length,
          Items: forwardHeaders
        }
      },
      LambdaFunctionAssociations: {
        Quantity: lambdaAssociations.length,
        Items: lambdaAssociations
      }
    }
  }

  const cfDistributionArn = await getCloudFrontDistributionArnByTags(
    cloudFront,
    tags
  )

  let cfDomainName = null

  if (cfDistributionArn == null) {
    const { DomainName } = await cloudFront
      .createDistributionWithTags({
        DistributionConfigWithTags: {
          DistributionConfig: distributionConfig,
          Tags: {
            Items: tags
          }
        }
      })
      .promise()

    cfDomainName = DomainName
  } else {
    const distributionId = getDistributionId(cfDistributionArn)

    const {
      Distribution: { DistributionConfig: currentConfig },
      ETag
    } = await cloudFront
      .getDistribution({
        Id: distributionId
      })
      .promise()

    const updatedConfig = {
      ...currentConfig,
      ...distributionConfig
    }

    const {
      Distribution: { DomainName }
    } = await cloudFront
      .updateDistribution({
        DistributionConfig: updatedConfig,
        Id: distributionId,
        IfMatch: ETag
      })
      .promise()

    cfDomainName = DomainName
  }

  return cfDomainName
}

const createCloudFrontDistribution = async ({
  accessKeyId,
  secretAccessKey,
  region,
  bucketName,
  domainName,
  domainCertificateArn,
  callerReference,
  stageTagName,
  stage,
  functionVersionArn
}) => {
  console.log('createCloudFrontDistribution')
  const tags = [
    {
      Key: stageTagName,
      Value: stage
    },
    {
      Key: 'resolve-type',
      Value: 'cloudfront-distribution-uploader'
    }
  ]

  const originAccessIdentity = await ensureOriginAccessIdentity({
    accessKeyId,
    secretAccessKey,
    region,
    stage
  })

  await createS3Bucket({
    accessKeyId,
    secretAccessKey,
    region,
    Bucket: bucketName,
    ACL: 'private',
    originAccessIdentity
  })

  return await ensureDistribution({
    accessKeyId,
    secretAccessKey,
    region,
    bucketName,
    domainName,
    domainCertificateArn,
    callerReference,
    originAccessIdentity,
    functionVersionArn,
    tags
  })
}

export default createCloudFrontDistribution
