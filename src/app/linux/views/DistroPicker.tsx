"use client";

import { useLinuxText } from "../hooks/useLinuxText";
import { choiceCard, goldButton, pageFrame, titleClass } from "../guide-styles";
import type { Distro } from "../guide-model";
import { scopeSvg } from "./svg";

/** Distro choices. Keeping the current one returns to the route that opened the picker. */
export function DistroPicker({
    distros,
    selectedId,
    canKeep,
    onChoose,
    onKeep,
}: {
    distros: Distro[];
    selectedId: string | null;
    canKeep: boolean;
    onChoose: (id: string) => void;
    onKeep: () => void;
}) {
    const { t } = useLinuxText();
    return (
        <section className="guide-stage" aria-labelledby="distro-title">
            <div className={pageFrame}>
                <h1 id="distro-title" className={titleClass}>{t("nav.dTitle")}</h1>
            <div className="guide-choices guide-choices-2 mt-6 grid gap-3 sm:grid-cols-2" role="group" aria-label={t("nav.dGroup")}>
                {distros.map((distro) => (
                    <button
                        key={distro.id}
                        type="button"
                        className={`${choiceCard} grid min-h-[7.5rem] grid-cols-[48px_minmax(0,1fr)] grid-rows-[auto_1fr] gap-x-3`}
                        style={{ ["--d" as string]: distro.color, ["--ig" as string]: distro.glyph }}
                        aria-pressed={distro.id === selectedId}
                        onClick={() => onChoose(distro.id)}
                    >
                        <span className={`distro-mark col-start-1 row-span-2 inline-grid h-12 w-12 place-items-center rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] ${distro.art ? "is-art overflow-hidden bg-[#111]" : "bg-[rgb(var(--d))]"}`} dangerouslySetInnerHTML={{ __html: scopeSvg(distro.svg, distro.id) }} />
                        <strong className="col-start-2 font-display text-2xl font-semibold">{t(distro.nameKey)}</strong>
                        <span className="col-start-2 text-foreground-muted">{t(distro.blurbKey)}</span>
                    </button>
                ))}
            </div>
            {canKeep && selectedId && (
                <p className="mt-4">
                    <button type="button" className={goldButton} onClick={onKeep}>{t("nav.dKeep")}</button>
                </p>
            )}
            </div>
        </section>
    );
}
