"use client";

import { useTranslations } from "@/app/lib/localization/client";
import { Download } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

const DownloadModal = dynamic(() => import("./DownloadModal").then((module) => module.DownloadModal), { ssr: false });

const triggerClassName = "inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-crimson/30 bg-crimson/30 px-2.5 py-1.5 font-label text-sm uppercase leading-none tracking-[0.16em] text-white transition-colors hover:border-crimson-hover hover:bg-crimson-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson focus-visible:ring-offset-2 focus-visible:ring-offset-background xl:px-3";

/** Navbar download button. The dialog chunk loads on the first click. */
export function DownloadTrigger() {
    const { t } = useTranslations("common");
    const [open, setOpen] = useState(false);
    if (open) return <DownloadModal trigger="navbar" initialOpen showTrigger={false} />;
    return (
        <button type="button" aria-haspopup="dialog" className={triggerClassName} onClick={() => setOpen(true)}>
            <Download aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} />
            {t("download.trigger")}
        </button>
    );
}
