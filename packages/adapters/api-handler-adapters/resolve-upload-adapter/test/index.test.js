import AWS from 'aws-sdk'
import crypto from 'crypto'

import createUploadAdapter from '../src'
import createCloudFrontDistribution from '../src/resource/createCloudFrontDistribution'
// import { execute } from '../src/resource/lambda-uploader/handler'
jest.setTimeout(50000)

const cloudConfig = {
  accessKeyId: 'AKIAZOX2ORRSEM4HWSMO',
  secretAccessKey: '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',
  region: 'us-east-1',
  bucket: 'resolve-uploader-test',
  endpoint: 's3.us-east-1.amazonaws.com',
  useAccelerateEndpoint: true
}

const localConfig = {
  accessKeyId: 'S3RVER',
  secretAccessKey: 'S3RVER',
  endpoint: `http://localhost:3001`,
  bucket: 'files',
  sslEnabled: false,
  s3ForcePathStyle: true
}

test.only('upload', async () => {
  const uploadAdapter = createUploadAdapter(localConfig)

  const { uploadUrl, uploadId } = await uploadAdapter.createUploader()

  await uploadAdapter.upload(uploadUrl)

  console.log(uploadUrl)
  console.log(uploadId)
})

test('post', async () => {
  const uploadAdapter = createUploadAdapter(localConfig)

  const { form, uploadId } = await uploadAdapter.createPresignedPost()

  await uploadAdapter.uploadFormData(form)
})

test('cloudfront', async () => {
  const result = await createCloudFrontDistribution({
    accessKeyId: 'AKIAZOX2ORRSEM4HWSMO',
    secretAccessKey: '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',
    region: 'us-east-1',
    bucketName: 'resolve-uploader-test',
    domainName: 'resolve-sandbox.ml',
    domainCertificateArn:
      'arn:aws:acm:us-east-1:650139044964:certificate/331e0723-7766-455e-ac7d-6c504b38b02e',
    callerReference: 'resolve-uploader-sandbox',
    stageTagName: 'resolve-stage',
    stage: 'sandbox',
    functionVersionArn:
      'arn:aws:lambda:us-east-1:650139044964:function:uploader-lambda-test:11'
  })

  console.log(result)
})

test('lambda', async () => {
  const payload = Buffer.from(
    JSON.stringify({
      deploymentId: 'deploymentId',
      dir: 'dir',
      expireTime: Date.now() + 200000
    })
  ).toString('base64')

  const signature = crypto
    .createHmac('md5', 'key')
    .update(payload)
    .digest('hex')

  const token = `token=${payload}*${signature}`

  const event = {
    Records: [
      {
        cf: {
          request: {
            querystring: token,
            uri: ''
          }
        }
      }
    ]
  }

  console.log(token.substr(6))
  // await execute(event, {})
})
