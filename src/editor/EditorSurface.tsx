"use client";

import LoadingSurface from "@/components/LoadingSurface";
import { useAppSelector } from "@/lib/hooks";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

const Editor = dynamic(() => import("@/editor/Editor"), {
    loading: LoadingSurface,
    ssr: false
});

export default function EditorSurface({sessionId}: {sessionId: string}) {

    const loading = useAppSelector(state => state.sessions.loading);
    const session = useAppSelector(state => state.sessions.sessions[sessionId]);

    if (loading) return <LoadingSurface />
    if (!session) return redirect("/");

    return (
        <div className="w-4/6 mx-auto pointer-events-none relative">
            <Editor session={session} className="bg-card rounded-lg border outline-none shadow-sm focus:shadow-md p-16 relative pointer-events-auto z-10" />
        </div>
    )
}