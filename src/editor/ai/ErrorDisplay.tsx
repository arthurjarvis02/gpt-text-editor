"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { reset } from "@/lib/features/ai/aiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { Sparkles } from "lucide-react";

export default function ErrorDisplay() {

    const inAiMode = useAppSelector(state => state.ai.inAiMode);
    const loading = useAppSelector(state => state.ai.loading);
    const error = useAppSelector(state => state.ai.error);
    const errorMessage = useAppSelector(state => state.ai.errorMessage);
    const suggestions = useAppSelector(state => state.ai.suggestions);
    const dispatch = useAppDispatch();

    const NoSuggestions = () => (
        <>
            <DialogHeader><DialogTitle>ChatGPT didn't have any suggestions</DialogTitle></DialogHeader>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="submit">Ok</Button>
                </DialogClose>
            </DialogFooter>
        </>
    );

    const ErrorMessage = () => (
        <>
            <DialogHeader><DialogTitle>ChatGPT couldn't edit the text</DialogTitle></DialogHeader>
            <div className="flex">
                <Sparkles className="w-5 h-5 flex-none mr-2 mt-1" />
                <p>"{errorMessage}"</p>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="submit">Ok</Button>
                </DialogClose>
            </DialogFooter>
        </>
    );

    return (
        <Dialog open={inAiMode && !loading && (error || !suggestions.length)} onOpenChange={(open) => !open && dispatch(reset())}>
            <DialogContent>
                {error ? <ErrorMessage /> : <NoSuggestions />}
            </DialogContent>
        </Dialog>
    );
}