import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID!
export const R2_BUCKET     = process.env.R2_BUCKET!
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!   // e.g. https://pub-xxx.r2.dev or custom domain

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export function r2PublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}

export async function r2PresignedPut(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 3600 },
  )
}

export async function r2List(): Promise<{ name: string }[]> {
  const { Contents = [] } = await r2.send(new ListObjectsV2Command({ Bucket: R2_BUCKET }))
  return Contents
    .filter(obj => obj.Key && obj.Key !== '.emptyFolderPlaceholder')
    .sort((a, b) => (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0))
    .map(obj => ({ name: obj.Key! }))
}

export async function r2Delete(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
}
