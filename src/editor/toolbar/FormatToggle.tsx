"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { $convertToMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, TextFormatType } from "lexical";
import { useCallback, useEffect, useState } from "react";

export default function FormatToggle({format, ...props}: {format: TextFormatType} & ButtonProps) {

    const [editor] = useLexicalComposerContext();

    const [isFormatActive, setIsFormatActive] = useState(false);

    const $checkIfFormatActive = useCallback(() => {

        const selection = $getSelection();

        $isRangeSelection(selection) && setIsFormatActive(selection.hasFormat(format));

    }, [editor, format]); /* eslint-disable-line react-hooks/exhaustive-deps */

    useEffect(() => {

        return editor.registerUpdateListener(({editorState}) => {

            editorState.read(() => {

                $checkIfFormatActive();
            });
        });

    }, [editor, $checkIfFormatActive]);

    return (
        <Button {...props}
            onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
            }}
            variant={isFormatActive ? "secondary" : "ghost"}
        />
    );
}