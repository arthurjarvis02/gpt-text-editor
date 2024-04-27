import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import StoreProvider from "./StoreProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project",
  description: "AI collaborative text editor",
};

export default function RootLayout({children}: {children: React.ReactNode}) {

    return (
        <html lang="en">
            <body className={cn(inter.className, "bg-muted overflow-y-scroll -z-10 relative")}>
                <StoreProvider>
                   {children}
                </StoreProvider>
            </body>
        </html>
    );
}