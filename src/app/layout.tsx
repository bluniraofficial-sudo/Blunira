import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blunira — Smart QR Hydration Marketing",
  description: "Track Blunira QR campaigns in real-time, capture leads, and manage redemption workflows.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.setAttribute('data-theme', 'light');
                } else {
                  document.documentElement.removeAttribute('data-theme');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
