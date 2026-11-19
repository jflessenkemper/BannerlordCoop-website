import type { Metadata } from "next";
import { getLocale, getOpenGraphLocale, getTranslations } from "@/app/lib/localization/server";
import { fontClassName } from "./fonts";
import "./globals.css";


/** Resolves shared metadata from the same explicit locale cookie as the root document. */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations("common");
  return {
  metadataBase: new URL("https://bannerlordcoop.com"),

  title: {
    default: "Bannerlord Co-op",
    template: "%s | Bannerlord Co-op",
  },

  description: t("metadata.description"),

  openGraph: {
    type: "website",
    locale: await getOpenGraphLocale(),
    siteName: "Bannerlord Co-op",
    title: "Bannerlord Co-op",
    description: t("metadata.description"),
    images: [
      {
        url: "/images/banner.png",
        width: 1200,
        height: 630,
        alt: "Bannerlord Co-op",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Bannerlord Co-op",
    description: t("metadata.description"),
    images: ["/images/banner.png"],
  }
  };
}

/** Document shell only. Client providers live on the routes that need them. */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={fontClassName}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
