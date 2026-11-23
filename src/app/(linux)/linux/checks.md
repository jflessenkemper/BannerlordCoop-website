# Linux guide checks

These run against the static guide. A violation fails the check.

1. Glossary popover. At 390, 768, 1024 and 1440, on every route and locale that has a term, the open popover stays fully inside the viewport and within 16px of its trigger, including after the page is scrolled.
2. Text spacing. Visible prose has no letter or digit glued to the next inline element's text (`UDP4200`). A space that belongs to a text piece is still present. No line starts with a punctuation fragment split off a glossary term (`/Wine`). No space sits between inline code and the following punctuation or slash (`$HOME /`).
3. Step bar. On every wizard step, at every width, the action bar's bottom edge is the viewport bottom, and the last content can scroll clear of the bar. Phones keep the safe-area inset.
4. Distro chip. On every guide page that shows it, the chip is right-aligned to the content edge and does not overlap the breadcrumb, at 390, 768, 1024 and 1440.
5. Backdrop. On the longest page, the average background colour at the top, middle and bottom differs by less than 8 per channel at 390 and 1440. The tint does not drift as you scroll.
6. Recommended glow. The gold halo uses the softened values: outer blur at most 16px and gold alpha at most 0.4.
7. Code highlighting. Every code block contains token spans, and copying `data-raw` (or the code's text with the spans removed) matches the script byte for byte.
8. Fonts. Heading and body use the webfont when the page is revealed. The title does not move after that. The files are preloaded and use `font-display: block`.
9. Navbar. After scrolling to the middle and the bottom of every guide route, including the main menu, the checklist, and the FAQ, at 390, 768, 1024 and 1440, the site navbar's top is 0 and it is visible. Where the guide sub-navbar is present, its top meets the navbar's bottom. In-page anchors clear both bars. The breadcrumb divider matches the line between the distro name and "Change distro": same colour and height, decorative, and not a slash. No disclosure summary is only a time or optional label. Check 2 also fails when a space sits between inline code and the following punctuation or slash.
10. Checklist stages. The full checklist has no table of contents. Every stage is a native disclosure with a numbered header, the first stage starts open, and the others start closed. A deep link opens that stage and lands below both pinned bars. A closed stage still contains its `data-raw` commands.
11. Response. On the desktop, every guide control's next paint is under 100ms, and a route change shows the next page's heading in under 1s. Mobile 4x timings are reported and are not a failure by themselves.
12. Reveal. The filmstrip of a guide load is the site background only, then the finished page. Nothing is drawn before the fade.
13. Button underlines. At 320, 390, 1024 and 1440, no button or button-styled link has a computed text underline in the resting, hover, focus, active, or visited state. Glossary terms keep their dotted underline. Prose links keep a solid underline.
14. Script checks. A check mark is shown when the manifest records a VirusTotal report for that file's sha256. Every check mark's sha256 matches the published file and the VirusTotal link. The signing line is present only when an attestation URL is recorded.
15. Lighthouse CI. On the English export, every route's 3-run median is 100 for performance, accessibility, best practices, and SEO, on mobile and desktop. HTML, script, and stylesheet transfers stay inside their byte budgets. Fonts and images have separate budgets and are not rewritten.
16. Unlighthouse. Every English route is scanned, and none scores below the Lighthouse CI bars.
17. Nu HTML Checker. `vnu.jar` reports zero errors on the exported pages.
18. pa11y-ci. HTML_CodeSniffer and axe report zero issues on every English route. Color contrast is measured by check 22, because the guide's scrim is a fixed layer that axe does not composite.
19. jsx-a11y. `eslint-plugin-jsx-a11y` reports zero errors on the guide source.
20. size-limit. The guide's script and stylesheet stay inside their budgets. Font files and images are budgeted apart and are not modified.
21. Web interface guidelines. Keyboard use, 24px targets (44px on touch), reduced motion, and focus clearing the pinned bars all pass in Playwright.
22. Contrast. Text, including text drawn over the backdrop, meets WCAG AA.
23. linkinator. No link in the English export is broken. Links to other languages are outside this export.
24. axe flows. Tab order reaches the check mark, the popover opens, Escape closes it, and focus returns to the mark. `@axe-core/playwright` reports no WCAG 2.2 violations on that path.
