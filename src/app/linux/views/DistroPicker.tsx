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
        <section className={`${pageFrame} py-10 sm:py-14`} aria-labelledby="distro-title">
            <h1 id="distro-title" className={titleClass}>{t("nav.dTitle")}</h1>
            <div className="guide-choices guide-choices-2" role="group" aria-label={t("nav.dGroup")}>
                {distros.map((distro) => (
                    <button
                        key={distro.id}
                        type="button"
                        className={`${choiceCard} min-h-[4.75rem] flex-row items-center gap-3`}
                        style={{ ["--d" as string]: distro.color, ["--ig" as string]: distro.glyph }}
                        aria-pressed={distro.id === selectedId}
                        onClick={() => onChoose(distro.id)}
                    >
                        <span className={`distro-mark inline-grid h-12 w-12 shrink-0 place-items-center rounded-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] ${distro.art ? "is-art overflow-hidden bg-[#111]" : "bg-[rgb(var(--d))]"}`} dangerouslySetInnerHTML={{ __html: scopeSvg(distro.svg, distro.id) }} />
                        <strong className="font-display text-2xl font-semibold" style={{ color: `rgb(${distro.color})` }}>{t(distro.nameKey)}</strong>
                    </button>
                ))}
            </div>
            {canKeep && selectedId && (
                <p className="mt-4">
                    <button type="button" className={goldButton} onClick={onKeep}>{t("nav.dKeep")}</button>
                </p>
            )}
        </section>
    );
}
