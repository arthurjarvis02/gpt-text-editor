"use client";

import { useAppSelector } from "@/lib/hooks";
import SessionCard from "./SessionCard";
import LoadingSurface from "@/components/LoadingSurface";
import NewSessionButton from "@/components/session/NewSessionButton";

export default function SessionBrowserSurface() {

    const sessionsState = useAppSelector(state => state.sessions);

    if (sessionsState.loading) return <LoadingSurface />

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {Object.entries(sessionsState.sessions).map(([sessionId, session]) => 
                    <SessionCard key={sessionId} session={session} />
                )}
            </div>
        </>
    )
}