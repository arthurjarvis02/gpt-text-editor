"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { reset, setAccepted, setAllAccepted } from "@/lib/features/ai/aiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ArrowLeft, Check, CheckCheck, LoaderCircle, Save, Sparkles, X } from "lucide-react";
import { useCallback } from "react";
import { $createTextNode, $getRoot } from "lexical";
import { $saveAcceptedSuggestions } from "./SuggestionDisplayPlugin";

export default function AiToolbar() {

    const loading = useAppSelector(state => state.ai.loading);
    const suggestions = useAppSelector(state => state.ai.suggestions);
    const dispatch = useAppDispatch();
    const [editor] = useLexicalComposerContext();

    if (loading) return (
        <div className="flex gap-1 items-center">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span>Loading edits...</span>
        </div>
    );

    return (
        <div className="flex gap-1 items-center">
            {/* <Button variant="ghost" size="sm" onClick={() => {
                dispatch(setAllAccepted(false));
                editor.update(() => $saveAcceptedSuggestions());
                dispatch(reset());
            }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button> */}

            <Sparkles className="w-4 h-4" />

            <span>{suggestions.length} suggestion{suggestions.length === 1 || "s"}</span>

            <div className="w-1" />

            <Separator orientation="vertical" className="h-9 my-auto" />

            <div className="w-1" />

            <Button className="text-red-600 hover:bg-red-100" variant="ghost" size="sm" onClick={() => dispatch(setAllAccepted(false))}>
                <X className="w-4 h-4 mr-2" />
                Reject all
            </Button>
            <Button className="text-green-600 hover:bg-green-100" variant="ghost" size="sm" onClick={() => dispatch(setAllAccepted(true))}>
                <Check className="w-4 h-4 mr-2" />
                Accept all
            </Button>
            <div className="w-1" />
            <Button variant="default" size="sm" onClick={() => {
                editor.update(() => $saveAcceptedSuggestions());
                dispatch(reset());
            }}>
                <Save className="w-4 h-4 mr-2" />
                Save
            </Button>
        </div>
    );
}