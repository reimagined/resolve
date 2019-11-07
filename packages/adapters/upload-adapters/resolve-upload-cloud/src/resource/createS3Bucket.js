import S3 from 'aws-sdk/clients/s3'

const existS3Bucket = async ({
  accessKeyId,
  secretAccessKey,
  region,
  Bucket
}) => {
  console.log('existS3Bucket')

  const s3 = new S3({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    region
  })

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
  region,
  Bucket,
  ACL,
  originAccessIdentity
}) => {
  console.log('createS3Bucket')

  const s3 = new S3({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    region
  })

  const bucketExists = await existS3Bucket({
    accessKeyId,
    secretAccessKey,
    region,
    Bucket
  })

  if (!bucketExists) {
    console.log('createBucket')

    await s3
      .createBucket({
        Bucket,
        ACL
      })
      .promise()
    console.log('putBucketCors')

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
    console.log('putBucketAccelerateConfiguration')

    await s3
      .putBucketAccelerateConfiguration({
        Bucket,
        AccelerateConfiguration: {
          Status: 'Enabled'
        }
      })
      .promise()
  }
  console.log('putBucketPolicy')

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
  console.log('putPublicAccessBlock')

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
