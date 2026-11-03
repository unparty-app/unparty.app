// Whether this deployment has a Vercel Blob store to put files in. @vercel/blob
// 2.x signs in either way Vercel connects a store: OIDC with BLOB_STORE_ID
// (newer connections, on Vercel), or BLOB_READ_WRITE_TOKEN (older ones, and
// the copy in .env that npm run dev uses). Neither set, uploads are off: say so
// instead of letting put() throw into a 500.
export function blobStoreConnected(): boolean {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN)
}
