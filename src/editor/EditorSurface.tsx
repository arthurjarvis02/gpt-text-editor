"use client";

import LoadingSurface from "@/components/LoadingSurface";
import { setCurrentSessionId } from "@/lib/features/ai/aiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

const Editor = dynamic(() => import("@/editor/Editor"), {
    loading: LoadingSurface,
    ssr: false
});

export default function EditorSurface({sessionId}: {sessionId: string}) {

    const dispatch = useAppDispatch();
    const loading = useAppSelector(state => state.sessions.loading);
    const session = useAppSelector(state => state.sessions.sessions[sessionId]);
    const currentSessionId = useAppSelector(state => state.ai.currentSessionId);

    if (loading) return <LoadingSurface />
    if (!session) return redirect("/");

    if (currentSessionId !== sessionId) {
        dispatch(setCurrentSessionId(sessionId));
    }

    return (
        <div className="w-11/12 md:w-10/12 lg:w-9/12 xl:w-7/12 mx-auto pointer-events-none relative">
            <Editor session={session} className="bg-card rounded-lg border outline-none shadow-sm focus:shadow-md p-16 relative pointer-events-auto z-10" />
        </div>
    )
}