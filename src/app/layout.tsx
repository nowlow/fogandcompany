import type { Metadata, Viewport } from "next";
import { getLocale, getDict } from "@/lib/i18n";
import { I18nProvider } from "@/components/I18n";
import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return {
    title: {
      default: `${APP_NAME}, ${t.landing.title1} ${t.landing.title2}`,
      template: `%s · ${APP_NAME}`,
    },
    description: t.landing.aboutBody(APP_NAME).slice(0, 160),
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#f2ece0",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${instrument.variable} ${plexMono.variable}`}
    >
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
