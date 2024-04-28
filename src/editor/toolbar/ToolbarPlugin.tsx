"use client";

import { createPortal } from "react-dom";
import Toolbar from "./Toolbar";
import { useAppSelector } from "@/lib/hooks";
import AiToolbar from "../ai/AiToolbar";

export default function ToolbarPlugin() {

    const displayAiToolbar = useAppSelector(state => state.ai.inAiMode && (state.ai.loading || !state.ai.error && state.ai.suggestions.length));

    const elem = document.getElementById("editor-toolbar");

    return elem && createPortal(displayAiToolbar ? <AiToolbar/> : <Toolbar />, elem, "editor-toolbar");
}