"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_NORMAL, LexicalCommand } from "lexical";
import { useEffect, useState } from "react";

export default function CommandButton<T>({enabledCommand, clickCommand, getClickPayload, ...props}: {enabledCommand: LexicalCommand<boolean>, clickCommand: LexicalCommand<T>, getClickPayload: () => T} & ButtonProps) {

    const [enabled, setEnabled] = useState<boolean>();
    const [editor] = useLexicalComposerContext();

    useEffect(() => editor.registerCommand(enabledCommand, (enabled) => {

        setEnabled(enabled);
        return true;

    }, COMMAND_PRIORITY_NORMAL), [editor]);

    return <Button disabled={!enabled} onClick={() => editor.dispatchCommand(clickCommand, getClickPayload())} {...props} />;
}