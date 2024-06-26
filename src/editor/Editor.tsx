"use client";

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { Session } from "@/lib/features/sessions/sessionsSlice";
import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable, Props } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { updateSession } from '@/lib/features/sessions/sessionsSlice';
import ToolbarPlugin from './toolbar/ToolbarPlugin';
import LockEditorPlugin from './LockEditorPlugin';
import SuggestionNode from './ai/SuggestionNode';
import SuggestionDisplayPlugin from './ai/SuggestionDisplayPlugin';
import SpacerTextNode from './ai/SpacerTextNode';
import ErrorDisplay from './ai/ErrorDisplay';
import HistoryWithoutSuggestionsPlugin from './ai/HistoryWithoutSuggestionsPlugin';

export default function Editor({session, ...props}: {session: Session} & Props) {

    const dispatch = useAppDispatch();
    const inAiMode = useAppSelector(state => state.ai.inAiMode);

    const initialConfig: InitialConfigType = {

        namespace: "project_editor",
        onError: err => console.log(err),
        editorState: editor => {

            const savedEditorState = session.editorState;
            savedEditorState && editor.setEditorState(editor.parseEditorState(savedEditorState))
        },
        theme: {
            text: {
                bold: "font-bold",
                italic: "italic",
                underline: "underline",
                strikethrough: "line-through"
            }
        },
        nodes: [
            SuggestionNode,
            SpacerTextNode
        ]
    }

    return (
        <>
            <LexicalComposer initialConfig={initialConfig}>
                <RichTextPlugin 
                    contentEditable={
                        <ContentEditable
                            {...props}
                        />
                    }
                    placeholder={<></>}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <OnChangePlugin 
                    onChange={
                        editorState => {
                            !inAiMode &&
                            dispatch(updateSession({
                                id: session.id,
                                editorState: editorState.toJSON()
                            }))
                        }
                    }
                />
                <ToolbarPlugin />
                <LockEditorPlugin locked={inAiMode} />
                <SuggestionDisplayPlugin />
                <HistoryWithoutSuggestionsPlugin />
            </LexicalComposer>
            <ErrorDisplay />
        </>
    );
}