import NewSessionButton from "@/components/session/NewSessionButton";
import SessionBrowserSurface from "@/browser/SessionBrowserSurface";
import TitleBar from "@/components/TitleBar";
import { File } from "lucide-react";

export default function Home() {

    console.log("Rendered home page")

    return (
        <>
            <TitleBar
                children={
                    <h1 className="text-xl font-bold">Project</h1>
                }
                controls={
                    <NewSessionButton>
                    </NewSessionButton>
                } 
            />

            <div className="p-4">
                <SessionBrowserSurface />
            </div>
        </>
    )
}