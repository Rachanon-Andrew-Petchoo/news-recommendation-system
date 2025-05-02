"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { createContext, useContext, useEffect, useState } from "react"

const UserContext = createContext<{ userId: number | null }>({ userId: null })

export function useUserId() {
  return useContext(UserContext).userId
}

function SyncUser({ setUserId }: { setUserId: (id: number) => void }) {
  const { status } = useSession()

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/auth/sync-user", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.user_id) setUserId(data.user_id)
        })
    }
  }, [status])

  return null
}

export function SessionWrapper({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null)

  return (
    <SessionProvider>
      <UserContext.Provider value={{ userId }}>
        <SyncUser setUserId={setUserId} />
        {children}
      </UserContext.Provider>
    </SessionProvider>
  )
}
