import S3 from 'aws-sdk/clients/s3'

const deleteS3Bucket = async ({
  accessKeyId,
  secretAccessKey,
  endpoint,
  region,
  Bucket
}) => {
  const s3 = new S3({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    endpoint,
    region
  })

  await s3.deleteBucket({ Bucket }).promise()
}

export default deleteS3Bucket
