"use client";

import TitleBar from "@/components/TitleBar";
import RenameSessionButton from "@/components/session/RenameSessionButton";
import SessionTitle from "@/components/session/SessionTitle";
import EditorSurface from "@/editor/EditorSurface";

export default function Session({params: {sessionId}}: {params: {sessionId: string}}) {

    return (
        <>
            <TitleBar
                children={
                    <div className="flex">
                        <SessionTitle sessionId={sessionId} className="text-xl font-bold" />
                        <RenameSessionButton sessionId={sessionId} className="ml-2" />
                    </div>
                }
                controls={
                    <div id="editor-toolbar" />
                }
            />
            <div className="p-4">
                <EditorSurface sessionId={sessionId} />
            </div>
        </>
    );
}