"use client"

import { useEffect, useRef } from "react"
import { Provider } from "react-redux"
import { makeStore, AppStore } from "../lib/store"
import { initializeSessions } from "@/lib/features/sessions/sessionsSlice"

export default function StoreProvider({children}: {children: React.ReactNode}) {

    const storeRef = useRef<AppStore>()

    useEffect(() => {

        if (!storeRef.current) return;
        const savedSessions = JSON.parse(localStorage.getItem("sessions") || "{}")
        storeRef.current.dispatch(initializeSessions(savedSessions))

    }, []);
    
    if (!storeRef.current) {

        // Create the store instance the first time this renders
        storeRef.current = makeStore()
        storeRef.current.subscribe(() => {
            if (!storeRef.current || storeRef.current.getState().sessions.loading) return;
            localStorage.setItem("sessions", JSON.stringify(storeRef.current!.getState().sessions.sessions))
        });
    }

    return <Provider store={storeRef.current}>{children}</Provider>
}