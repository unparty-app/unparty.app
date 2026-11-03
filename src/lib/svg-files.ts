import path from 'path'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'

// The icon manager (src/app/components/SVG.tsx) edits files in public/svgs.
// A deployed site's files are read-only, so its write routes only work under
// `npm run dev`, and only for an admin.
export const SVG_DIR = path.join(process.cwd(), 'public', 'svgs')
export const SVG_TRASH_DIR = path.join(SVG_DIR, 'trash')

// Returns a response to send instead when the request may not write files
export async function svgWriteGuard(): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'The icon manager only edits files on your computer, under npm run dev' },
      { status: 403 }
    )
  }
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  return null
}

// A bare file name like "star.svg": no folders, no "..", nothing hidden, so a
// name from the browser can never point outside public/svgs
export function safeSvgName(name: unknown): string | null {
  if (typeof name !== 'string') return null
  return /^[A-Za-z0-9][A-Za-z0-9 ._()-]*\.svg$/i.test(name) && !name.includes('..') ? name : null
}
