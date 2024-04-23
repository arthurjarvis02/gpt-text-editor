"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { updateSession } from "@/lib/features/sessions/sessionsSlice";
import { Pencil } from "lucide-react";

export default function RenameSessionButton({sessionId, ...props}: {sessionId: string} & ButtonProps) {

    const dispatch = useAppDispatch();
    const loading = useAppSelector(state => state.sessions.loading);
    const session = useAppSelector(state => state.sessions.sessions[sessionId]);

    const [newTitle, setNewTitle] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {

        isOpen && !loading && setNewTitle(session.title || "");

    }, [isOpen, loading])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        setNewTitle(e.target.value);
    }

    const handleSubmit = (e: React.FormEvent) => {

        e.preventDefault();
        dispatch(updateSession({
            id: session.id,
            title: newTitle
        }))
    };

    return (
        <Dialog onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {!loading &&
                        <Button size="iconXs" variant="ghost" {...props}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                }
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename File</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <Input value={newTitle} onChange={handleChange}/>
                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button type="submit">Save</Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}