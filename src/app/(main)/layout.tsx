import "~/styles/globals.css";
import { Navbar } from "~/app/_components/Navbar";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      {children}
    </main>
  );
}
