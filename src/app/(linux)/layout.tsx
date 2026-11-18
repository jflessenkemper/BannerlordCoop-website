/** Linux routes render their own chrome and do not load the site client shell. */
export default function LinuxGroupLayout({ children }: LayoutProps<"/">) {
    return children;
}
