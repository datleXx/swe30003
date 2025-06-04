import { Navbar } from "../_components/Navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col gap-4">
      <Navbar />
      {children}
    </main>
  );
}
