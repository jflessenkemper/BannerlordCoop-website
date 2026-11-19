# Linux guide checks

These run against the static guide. A violation fails the check.

1. Glossary popover. At 390, 768, 1024 and 1440, on every route and locale that has a term, the open popover stays fully inside the viewport and within 16px of its trigger, including after the page is scrolled.
2. Text spacing. Visible prose has no letter or digit glued to the next inline element's text (`UDP4200`). A space that belongs to a text piece is still present. No line starts with a punctuation fragment split off a glossary term (`/Wine`). No space sits between inline code and the following punctuation or slash (`$HOME /`).
3. Step bar. On every wizard step, at every width, the action bar's bottom edge is the viewport bottom, and the last content can scroll clear of the bar. Phones keep the safe-area inset.
4. Distro chip. On every guide page that shows it, the chip is right-aligned to the content edge and does not overlap the breadcrumb, at 390, 768, 1024 and 1440.
5. Backdrop. On the longest page, the average background colour at the top, middle and bottom differs by less than 8 per channel at 390 and 1440. The tint does not drift as you scroll.
6. Recommended glow. The gold halo uses the softened values: outer blur at most 16px and gold alpha at most 0.4.
7. Code highlighting. Every code block contains token spans, and copying `data-raw` (or the code's text with the spans removed) matches the script byte for byte.
8. Fonts. Heading and body use the webfont at first contentful paint. A filmstrip of the title shows no glyph or layout change after that paint. The files are preloaded and use `font-display: block`, so a slower first paint is accepted.
9. Navbar. After scrolling to the middle and the bottom of every guide route, including the main menu, the checklist, and the FAQ, at 390, 768, 1024 and 1440, the site navbar's top is 0 and it is visible. Where the guide sub-navbar is present, its top meets the navbar's bottom. In-page anchors clear both bars. The breadcrumb divider matches the line between the distro name and "Change distro": same colour and height, decorative, and not a slash. No disclosure summary is only a time or optional label. Check 2 also fails when a space sits between inline code and the following punctuation or slash.
10. Checklist stages. The full checklist has no table of contents. Every stage is a native disclosure with a numbered header, the first stage starts open, and the others start closed. A deep link opens that stage and lands below both pinned bars. A closed stage still contains its `data-raw` commands.
