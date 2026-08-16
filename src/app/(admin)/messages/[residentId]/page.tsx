import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/ui/Page'
import { StaffReplyThread } from '@/components/messaging/StaffReplyThread'
import { getOrCreateThread, loadThreadMessages, markThreadRead } from '@/lib/messaging/queries'
import { requireStaffAuth } from '@/lib/auth'
import { RESIDENT_NAME_SELECT, residentName } from '@/lib/utils/resident-name'
import { MESSAGES_LABELS } from '@/lib/constants/labels'

export const metadata: Metadata = { title: MESSAGES_LABELS.threadTitle }

export const dynamic = 'force-dynamic'

export default async function StaffThreadPage({
  params,
}: {
  params: Promise<{ residentId: string }>
}) {
  const { residentId } = await params
  const staff = await requireStaffAuth()

  const resident = await prisma.resident.findUnique({
    where: { id: residentId },
    select: RESIDENT_NAME_SELECT,
  })
  if (!resident) notFound()

  const thread = await getOrCreateThread(residentId)
  // Opening the conversation is reading it, so the inbox count reflects what
  // is actually outstanding rather than what has merely never been clicked.
  await markThreadRead(thread.id, { kind: 'staff', userId: staff.id })
  const messages = await loadThreadMessages(thread.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title={residentName(resident)}
        description={MESSAGES_LABELS.languageHint}
        backHref="/messages"
      />
      <StaffReplyThread residentId={residentId} initialMessages={messages} />
    </div>
  )
}
