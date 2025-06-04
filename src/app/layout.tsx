import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ElectroStore",
  description: "ElectroStore",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <main>
          <TRPCReactProvider>
            <SessionProvider>
              {children}
              <Toaster position="top-center" />
            </SessionProvider>
          </TRPCReactProvider>
        </main>
      </body>
    </html>
  );
}
