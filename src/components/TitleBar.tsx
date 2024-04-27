import { cn } from "@/lib/utils";

export default function TitleBar({className, children, controls, ...props}: React.HTMLAttributes<HTMLDivElement> & {controls?: React.ReactNode}) {

    return (
        <div className={cn("sticky top-0 left-0 drop-shadow-lg bg-white z-50 flex items-center justify-between h-12 px-4", className)}>
            
            <div className="flex-none w-1/4">
                {children}
            </div>

            {controls}

            <div className="w-1/4" />
        </div>
    )
}