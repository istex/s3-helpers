import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

let s3Client: S3Client | undefined;

function initS3Client(config: { endpoint: string, credentials: { accessKeyId: string, secretAccessKey: string } }) {
  return new S3Client({
    endpoint: config.endpoint,
    credentials: config.credentials,
    forcePathStyle: true,
  })
}

export function getS3Client(config?: { endpoint: string, credentials: { accessKeyId: string, secretAccessKey: string } }) {
  if (!s3Client) {
    if (!config) {
      throw new Error("S3 client cannot be created with empty configuration. Please consider calling the function with a correct config object.");
    }
    s3Client = initS3Client(config);
  }
  return s3Client;
}

export async function putFileToS3(bucket: string, key: string, file: File, s3Client?: S3Client) {
  if (!s3Client) {
    s3Client = getS3Client();
  }
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
    })
  )
}

export async function getFileFromS3(bucket: string, key: string, s3Client?: S3Client) {
  if (!s3Client) {
    s3Client = getS3Client();
  }
  return await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key
    })
  )
}

export async function getListObjectsFromS3(bucket: string, prefix: string, s3Client?: S3Client) {
  if (!s3Client) {
    s3Client = getS3Client();
  }
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  return response.Contents || [];
}

// For tests
export function resetS3Client() {
  s3Client = undefined;
}
