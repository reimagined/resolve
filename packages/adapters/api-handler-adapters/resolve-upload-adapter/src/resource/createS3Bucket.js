import S3 from 'aws-sdk/clients/s3'

const existS3Bucket = async (s3, Bucket) => {
  try {
    await s3
      .headBucket({
        Bucket
      })
      .promise()
    return true
  } catch (error) {
    if (error.code === 'NotFound') {
      return false
    }
    throw error
  }
}

const createS3Bucket = async ({
  accessKeyId,
  secretAccessKey,
  endpoint,
  region,
  Bucket,
  ACL,
  originAccessIdentity
}) => {
  const s3 = new S3({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    endpoint,
    region
  })

  const bucketExists = await existS3Bucket(s3, Bucket)

  if (!bucketExists) {
    await s3
      .createBucket({
        Bucket,
        ACL
      })
      .promise()

    await s3
      .putBucketCors({
        Bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ['*'],
              AllowedMethods: ['HEAD', 'PUT', 'POST', 'GET'],
              MaxAgeSeconds: 3000,
              AllowedHeaders: ['*']
            }
          ]
        }
      })
      .promise()

    await s3
      .putBucketAccelerateConfiguration({
        Bucket,
        AccelerateConfiguration: {
          Status: 'Enabled'
        }
      })
      .promise()
  }

  await s3
    .putBucketPolicy({
      Bucket,
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Id: 'ReSolveUploaderCloudFrontAccess',
        Statement: [
          {
            Sid:
              'Restrict access to object only for ReSolve uploader cloud front distribution',
            Effect: 'Allow',
            Principal: { CanonicalUser: originAccessIdentity.s3UserId },
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${Bucket}/*`
          }
        ]
      })
    })
    .promise()

  await s3
    .putPublicAccessBlock({
      Bucket,
      PublicAccessBlockConfiguration: {
        IgnorePublicAcls: true,
        BlockPublicAcls: true,
        RestrictPublicBuckets: true,
        BlockPublicPolicy: true
      }
    })
    .promise()
}

export default createS3Bucket
