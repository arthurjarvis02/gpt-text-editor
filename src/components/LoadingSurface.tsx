import { LoaderCircle } from "lucide-react";

export default function LoadingSurface() {
    return (
        <div className="flex justify-center pt-4">
            <LoaderCircle strokeWidth={1} className="h-12 w-12 animate-spin" />
        </div>
    )
}