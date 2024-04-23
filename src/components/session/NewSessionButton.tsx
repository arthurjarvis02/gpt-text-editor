"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { addSession } from "@/lib/features/sessions/sessionsSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { File } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Skeleton } from "../ui/skeleton";
import { RedirectType, redirect, useRouter } from "next/navigation";

export default function NewSessionButton({...props}: ButtonProps) {

    const dispatch = useAppDispatch();
    const loading = useAppSelector(state => state.sessions.loading);
    const router = useRouter();

    const handleNew = () => {

        const id = uuidv4();

        dispatch(addSession({id}));

        router.push(`/sessions/${id}`);
    }

    return (
        !loading &&
            <Button size="sm" {...props} onClick={handleNew}>
                <File className="h-4 w-4 mr-2" />New File
            </Button>
    )
}