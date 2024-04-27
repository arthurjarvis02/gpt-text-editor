"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bold, Italic, Sparkles, Underline } from "lucide-react";
import FormatToggle from "./FormatToggle";
import AiMenuButton from "../ai/AiMenuButton";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $getSelection } from "lexical";

export default function Toolbar() {

    const [editor] = useLexicalComposerContext();

    return (
        <div className="flex gap-1 items-center">

            <AiMenuButton size="iconSm" />

            <div className="w-1" />

            <Separator orientation="vertical" className="h-9 my-auto" />

            <div className="w-1" />
            <FormatToggle size="iconSm" format="bold"><Bold className="w-4 h-4" /></FormatToggle>
            <FormatToggle size="iconSm" format="italic"><Italic className="w-4 h-4" /></FormatToggle>
            <FormatToggle size="iconSm" format="underline"><Underline className="w-4 h-4" /></FormatToggle>
        </div>
    );
}