"use client";

import { useAppSelector } from "@/lib/hooks"
import { cn } from "@/lib/utils";

export default function SessionTitle({className, sessionId, ...props}: {sessionId: string, asChild?: boolean, children?: React.ReactNode} & React.HTMLAttributes<HTMLHeadingElement>) {

    const loading = useAppSelector(state => state.sessions.loading)
    const session = useAppSelector(state => state.sessions.sessions[sessionId])

    return (
        !loading && session &&
            <h1 className={cn({italic: !loading && !session.title}, "truncate", className)} {...props}>
                {session.title || "Untitled"}
            </h1>
    );
}