import Header from "@/components/header";
import Sidebar from "@/components/sidebar";

export default function ChatLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex justify-between items-start">
            <Sidebar />
            <main className="pl-[300px] w-full h-full">
                <Header />
                {children}
            </main>
        </div>
    );
}
