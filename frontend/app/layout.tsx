import { ToastArea } from "@code-x/lago";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import ApolloWrapper from "@/layout/ApolloWrapper";
import AppShell from "@/layout/AppShellLayout";
import AddToGroupProvider from "./providers/AddToGroupProvider";
import AuthModalProvider from "./providers/AuthModalProvider";
import LagoProvider from "./providers/LagoProvider";
import NavigationDataProvider from "./providers/NavigationDataProvider";
import QueryProvider from "./providers/QueryProvider";

import "./reset.css";
import "@code-x/lago/styles";
import "./globals.css";
import "./typePalette.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pokédex",
  description: "A Pokémon database with GraphQL API",
};

const themeScript = `(function(){try{var t=localStorage.getItem("ui-theme");document.documentElement.classList.toggle("dark-mode",t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches))}catch(e){}})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navigationData = await NavigationDataProvider();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static, build-time constant — the pre-paint theme script */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Script
          src="https://umami-fennec-ral.vercel.app/script.js"
          data-website-id="287fbbc3-48df-4bc8-9345-6904916483af"
          strategy="afterInteractive"
        />
        <Script
          src="https://umami-fennec-ral.vercel.app/recorder.js"
          data-website-id="287fbbc3-48df-4bc8-9345-6904916483af"
          strategy="afterInteractive"
        />
        <LagoProvider>
          <QueryProvider>
            <ApolloWrapper>
              <AuthModalProvider>
                <AddToGroupProvider>
                  <AppShell navigationData={navigationData}>{children}</AppShell>
                </AddToGroupProvider>
              </AuthModalProvider>
            </ApolloWrapper>
          </QueryProvider>
        </LagoProvider>
        <ToastArea />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
