"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { useEffect } from "react"

function SyncUser() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/auth/sync-user", { method: "POST" })
    }
  }, [status])

  return null
}

export function SessionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SyncUser />
      {children}
    </SessionProvider>
  )
}