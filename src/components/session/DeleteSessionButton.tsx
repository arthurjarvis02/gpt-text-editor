"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { deleteSession } from "@/lib/features/sessions/sessionsSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { Trash2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export default function DeleteSessionButton({sessionId, ...props}: {sessionId: string} & ButtonProps) {

    const loading = useAppSelector(state => state.sessions.loading);
    const dispatch = useAppDispatch();

    return (
        !loading &&
            <Button size="iconXs" variant="ghost" {...props} onClick={() => dispatch(deleteSession(sessionId))}>
                <Trash2 className="h-4 w-4" />
            </Button>
    )
}