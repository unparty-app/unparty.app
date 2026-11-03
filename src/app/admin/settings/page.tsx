import { redirect } from 'next/navigation'

// Settings live on /admin itself now (#748); the switches are its own group
export default function AdminSettingsPage() {
  redirect('/admin#features')
}
