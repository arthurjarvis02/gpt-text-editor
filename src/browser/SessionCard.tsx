import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Delete, File, FilePlus2, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Session } from "@/lib/features/sessions/sessionsSlice";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import DeleteSessionButton from "@/components/session/DeleteSessionButton";
import RenameSessionButton from "@/components/session/RenameSessionButton";
import SessionTitle from "@/components/session/SessionTitle";

export default function SessionCard({session, className, ...props}: React.HTMLAttributes<HTMLDivElement> & {session: Session}) {

    return (
        <Card className={cn("hover:shadow-md", className)} {...props}>
            <Link href={`/sessions/${session.id}`}>

                <CardHeader>
                    <SessionTitle className="font-semibold" sessionId={session.id} />
                </CardHeader>
            
            </Link>
            
            <CardFooter>
                <RenameSessionButton sessionId={session.id} />
                <DeleteSessionButton sessionId={session.id} />
            </CardFooter>
        </Card>
    );
}