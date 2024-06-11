"use client";

import TitleBar from "@/components/TitleBar";
import RenameSessionButton from "@/components/session/RenameSessionButton";
import SessionTitle from "@/components/session/SessionTitle";
import EditorSurface from "@/editor/EditorSurface";

export default function Session({params: {sessionId}}: {params: {sessionId: string}}) {

    return (
        <>
            <TitleBar
                controls={
                    <div id="editor-toolbar" />
                }
            >
                <div className="flex">
                    <SessionTitle sessionId={sessionId} className="text-xl font-bold pr-1" />
                    <RenameSessionButton sessionId={sessionId} className="mr-2" />
                </div>
            </TitleBar>
            
            <div className="p-4">
                <EditorSurface sessionId={sessionId} />
            </div>
        </>
    );
}