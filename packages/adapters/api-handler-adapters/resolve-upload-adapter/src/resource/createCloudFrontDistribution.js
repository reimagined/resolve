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
  endpoint,
  region,
  Comment,
  Marker,
  MaxItems = '200'
}) => {
  const cloudFront = new CloudFront({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    endpoint,
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
      endpoint,
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
  endpoint,
  region,
  stage
}) => {
  const cloudFront = new CloudFront({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    endpoint,
    region
  })
  const comment = `resolve-media-${stage}`

  let identity = await getCloudFrontOriginAccessIdentity({
    Region: region,
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
  endpoint,
  region,
  bucketName,
  domainName,
  domainCertificateArn,
  callerReference,
  originAccessIdentity,
  tags
}) => {
  const originId = `s3-${bucketName}`
  const originDomain = `${bucketName}.s3.amazonaws.com`

  const cloudFront = new CloudFront({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    endpoint,
    region
  })

  const distributionConfig = {
    CallerReference: callerReference,
    Comment: callerReference,
    Enabled: true,
    Aliases: {
      Quantity: 1,
      Items: [`static.${domainName}`]
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
          Quantity: 0,
          Items: []
        }
      },
      LambdaFunctionAssociations: {
        Quantity: 0,
        Items: []
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
  endpoint,
  region,
  bucketName,
  domainName,
  domainCertificateArn,
  callerReference,
  stageTagName,
  stage
}) => {
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
    endpoint,
    region,
    stage
  })

  await createS3Bucket({
    accessKeyId,
    secretAccessKey,
    endpoint,
    region,
    Bucket: bucketName,
    ACL: 'private',
    originAccessIdentity
  })

  return await ensureDistribution({
    accessKeyId,
    secretAccessKey,
    endpoint,
    region,
    bucketName,
    domainName,
    domainCertificateArn,
    callerReference,
    originAccessIdentity,
    tags
  })
}

export default createCloudFrontDistribution
