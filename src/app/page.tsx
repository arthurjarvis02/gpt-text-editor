import NewSessionButton from "@/components/session/NewSessionButton";
import SessionBrowserSurface from "@/browser/SessionBrowserSurface";
import TitleBar from "@/components/TitleBar";
import { File } from "lucide-react";

export default function Home() {

    console.log("Rendered home page")

    return (
        <>
            <TitleBar
                controls={
                    <NewSessionButton>
                    </NewSessionButton>
                } 
            >
                <h1 className="text-xl font-bold">GPT Text Editor</h1>
            </TitleBar>

            <div className="p-4">
                <SessionBrowserSurface />
            </div>
        </>
    )
}