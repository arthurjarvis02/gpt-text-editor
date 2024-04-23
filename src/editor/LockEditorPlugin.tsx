"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

export default function LockEditorPlugin({locked}: {locked: boolean}) {

    const [editor] = useLexicalComposerContext();

    useEffect(() => {
            
        editor.setEditable(!locked);
        console.log("editor locked", locked);

    }, [editor, locked])

    return null;
}