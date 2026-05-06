import { redirect } from 'next/navigation'

// Registration is disabled — only the superadmin can create users.
export default function RegisterPage() {
  redirect('/login')
}
