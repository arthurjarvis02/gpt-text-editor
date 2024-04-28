"use client";

import { useAppSelector } from "@/lib/hooks";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HistoryPlugin, createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";
import { mergeRegister } from "@lexical/utils";
import { CAN_UNDO_COMMAND, COMMAND_PRIORITY_CRITICAL, EditorState, UNDO_COMMAND } from "lexical";
import { useEffect, useState } from "react";

export default function HistoryWithoutSuggestionsPlugin() {

    const [editor] = useLexicalComposerContext();
    const [historyState, setHistoryState] = useState(() => createEmptyHistoryState());
    const inAiMode = useAppSelector(state => state.ai.inAiMode);

    console.log(historyState);

    useEffect(() => {

        setHistoryState(createEmptyHistoryState());

    }, [editor]);

    useEffect(() => {

        historyState.redoStack = [];
        historyState.current && historyState.undoStack.push(historyState.current);
        
    }, [inAiMode, editor]);

    return inAiMode || <HistoryPlugin externalHistoryState={historyState} />
}