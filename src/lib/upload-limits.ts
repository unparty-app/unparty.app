// Uploads pass through a Vercel Function, whose request body is capped at
// 4.5 MB. Checking first turns Vercel's bare 413 into a message people can act on.
export const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024
export const MAX_UPLOAD_LABEL = '4.5 MB'

// `code` on an upload route's error, so the page can answer with something
// better than the message: no Blob store connected (503), no session (401)
export const UPLOADS_OFF = 'uploads-off'
export const SIGNED_OUT = 'signed-out'
