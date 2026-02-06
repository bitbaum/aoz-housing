import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const code = formData.get('code')?.toString().trim().toUpperCase()

  if (!code) {
    redirect('/portal?error=code_required')
  }

  // Find resident by code
  const resident = await prisma.resident.findUnique({
    where: { code },
  })

  if (!resident) {
    redirect('/portal?error=invalid_code')
  }

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set('resident_code', code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  redirect('/portal')
}
