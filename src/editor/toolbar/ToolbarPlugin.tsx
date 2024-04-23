"use client";

import { createPortal } from "react-dom";
import Toolbar from "./Toolbar";
import { useAppSelector } from "@/lib/hooks";
import AiToolbar from "../ai/AiToolbar";

export default function ToolbarPlugin() {

    const inAiMode = useAppSelector(state => state.ai.inAiMode);

    const elem = document.getElementById("editor-toolbar");

    return elem && createPortal(inAiMode ? <AiToolbar/> : <Toolbar />, elem, "editor-toolbar");
}