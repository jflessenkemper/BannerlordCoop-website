/** Quiet placeholder so a route change does not paint the site-wide spinner first. */
export default function LinuxLoading() {
    return <div className="min-h-[calc(100dvh-4rem)] bg-background" aria-hidden="true" />;
}
