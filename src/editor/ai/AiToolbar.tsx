"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { reset, setAcceptedStatus, setAllAcceptedStatuses } from "@/lib/features/ai/aiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ArrowLeft, Check, CheckCheck, LoaderCircle, Save, Sparkles, X } from "lucide-react";
import { useCallback } from "react";
import TextChoiceNode from "./TextChoiceNode";
import { $createTextNode, $getRoot } from "lexical";

export default function AiToolbar() {

    const loading = useAppSelector(state => state.ai.loading);
    const edits = useAppSelector(state => state.ai.edits);
    const dispatch = useAppDispatch();
    const [editor] = useLexicalComposerContext();

    if (loading) return (
        <div className="flex gap-1 items-center">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span>Loading edits...</span>
        </div>
    );

    const handleSave = () => {

        editor.update(() => {

            for (const node of $getRoot().getAllTextNodes()) {

                if (node instanceof TextChoiceNode) {

                    const edit = edits.find(edit => edit.id === node.editId);
                    if (!edit) continue;

                    node.replace($createTextNode(edit.accepted ? node.newText : node.originalText));
                }
            }
        });

        dispatch(reset());

    };

    return (
        <div className="flex gap-1 items-center">
            <Button variant="ghost" size="sm" onClick={() => dispatch(reset())}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>

            <div className="w-1" />

            <Separator orientation="vertical" className="h-9 my-auto" />

            <div className="w-1" />

            <Button variant="ghost" size="sm" onClick={() => dispatch(setAllAcceptedStatuses(false))}>
                <X className="w-4 h-4 mr-2" />
                Reject all
            </Button>
            <Button variant="ghost" size="sm" onClick={() => dispatch(setAllAcceptedStatuses(true))}>
                <Check className="w-4 h-4 mr-2" />
                Accept all
            </Button>
            <div className="w-1" />
            <Button variant="default" size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
            </Button>
        </div>
    );
}