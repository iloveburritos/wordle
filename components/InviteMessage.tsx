'use client'

import React from 'react'

interface InviteMessageProps {
  identifier: string
}

export default function InviteMessage({ identifier }: InviteMessageProps) {
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL 
  const inviteMessage = `Join my private Wordle group. You can login to ${websiteUrl} using ${identifier}`

  return (
    <div className="p-4 border rounded bg-gray-100">
      <p>{inviteMessage}</p>
      <button
        onClick={() => navigator.clipboard.writeText(inviteMessage)}
        className="mt-2 text-blue-500 underline"
      >
        Copy Invite Message
      </button>
    </div>
  )
}