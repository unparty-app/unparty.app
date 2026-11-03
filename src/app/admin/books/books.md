# Books Database Reference

37 books in the database. Books marked ✅ already have quotes populated and are ready to use in editorial articles.

> Titles/authors below were regenerated from the live DB on 2026-09-05 after fixing #197 (ALL-CAPS titles) and a round of spelling corrections (see #553) — several titles and three author names had typos (e.g. "Winstein" → "Einstein", "Steve King" → "Steve Krug"). If you spot another one, fix it via `/admin/books` and drop a note in #553 so it can inform the spell-check workflow being scoped there.

---

## ✅ Books with Quotes (Ready to Use)

### 1. Sprint: How to Solve Big Problems and Test New Ideas in Just Five Days

- **ID:** `cmkmyw0xj0001vx6tgjpgy3rx`
- **Author:** Jake Knapp with John Zeratsky & Braden Kowitz
- **Quote:** "Your team knows a lot about your challenge."
- **Page:** 68
- **Publisher:** Simon and Schuster

### 2. How to Win Friends

- **ID:** `cmkmyw0nl0000vx6t8ci9kcdv`
- **Author:** Dale Carnegie
- **Quote:** "Too much talk is tiresome."
- **Page:** 198
- **Publisher:** Simon and Schuster

### 3. The Coaching Habit

- **ID:** `cmkmyw2wz000bvx6tzfz6ojvs`
- **Author:** Michael Bungay Stanier
- **Quote:** "The minute we begin to think we have all the answers, we forget the questions." — Madeline L'Engle
- **Page:** 194
- **Publisher:** Box of Crayons Press (original), Page Two Books, Inc.

### 4. Something's Off

- **ID:** `cmkmyw1bh0003vx6thm88szgp`
- **Author:** Virgil Abloh
- **Quote:** "The idea of obsession/Effigy."
- **Page:** ⚠️ missing — needs a page number (see #198) to display correctly in the citation modal
- **Publisher:** Taschen

---

## 📚 Books Available (Need Quotes Added)

1. A Hacker's Mind - Bruce Schneier (`cmkmyw85g0010vx6t0lh0lm72`)
2. The Design of Everyday Things - Don Norman (`cmkmyw7yk000zvx6txy3fd93d`)
3. The Color of Law - Richard Rothstein (`cmkmyw7q0000yvx6tpqu3g5ro`)
4. How to Make a Slave - Jerald Walker (`cmkmyw7im000xvx6ty5g8yt0x`)
5. The User Experience of One - Leah Buley (`cmkmyw7b7000wvx6t4dcepa2t`)
6. Signs - Laura Lynn Jackson (`cmkmyw740000vvx6t9teo8dxz`)
7. Don't Make Me Think - Steve Krug (`cmkmyw6x4000uvx6tzzzf871x`)
8. Designing Machine Learning Systems - Chip Huyen (`cmkmyw6q7000tvx6tqt7hr955`)
9. How We Fight for Our Lives - Saeed Jones (`cmkmyw6iy000svx6tf0ebi3uz`)
10. Everyday Ubuntu - Mungi Ngomane (`cmkmyw6bw000rvx6tl1gnt8p5`)
11. Black Founder - Stacy Spikes (`cmkmyw64z000qvx6twe8nmq6e`)
12. Strength Based Leadership - Tom Rath, Barry Conchie (`cmkmyw5xm000pvx6tm4ijhrej`)
13. Jay-Z Decoded - Shawn Carter (`cmkmyw5ql000ovx6t7bbmlqsq`)
14. The Challenger Sale - Matthew Dixon (`cmkmyw5ie000nvx6tdfrgasct`)
15. The Experience Machine - Andy Clark (`cmkmyw5aq000mvx6tpjev6ir4`)
16. Storytelling with Data - Knaflic (`cmkmyw4w8000lvx6tytvxkyj0`)
17. Machine Learning System Design Interview - Ali Amminian, Alex Xu (`cmkmyw4ox000kvx6typjk9q6v`)
18. Moonwalking with Einstein - Joshua Foer (`cmkmyw4hg000jvx6tqbm4wsu1`)
19. Buy Then Build - Walker Deibel (`cmkmyw4a8000ivx6tmg6mpajv`)
20. Overcoming Perfectionism Anxiety and Indecision - Cross Border Books (`cmkmyw433000hvx6tp0hjjl6o`)
21. Racism Without Racists - Bonilla-Silva (`cmkmyw3vt000gvx6t2igme0dy`)
22. The Art of Startup Fundraising - Cremas (`cmkmyw3p0000fvx6tu80dw7i1`)
23. Poverty, by America - Matthew Desmond (`cmkmyw3i0000evx6tqp103jy1`)
24. The Glass Menagerie - Tennessee Williams (`cmkmyw3b7000dvx6tagtw8el5`)
25. Notebooks 1941-1951 - Albert Camus (`cmkmyw33z000cvx6thjfob817`)
26. Customer Experience 3.0 - Goodman (`cmkmyw2p8000avx6tpv4pi2kp`)
27. Articulating Design Decisions - Greever (`cmkmyw2i90009vx6t7d82nrgo`)
28. AI Ethics - Mark Coeckelbergh (`cmkmyw2b10008vx6tg2lj68sy`)
29. Investing Quick Start Guide - Ted D Snow (`cmkmyw2440007vx6tcbs1ql16`)
30. The Book of Why - Judea Pearl, Dana Mackenzie (`cmkmyw1ww0006vx6tkjtv7mqe`)
31. Neural Networks and Deep Learning - Aggarwal (`cmkmyw1pj0005vx6t3danmzmq`)
32. The Marathon Don't Stop - Rob Kenner (`cmkmyw1if0004vx6t1xzlrzuq`)
33. Quantitative User Experience Research: Informing Product Decisions by Understanding Users at Scale - Chris Chapman, Kerry Rodden (`cmkmyw14d0002vx6tnkgnq2zq`)

---

## 💡 Using a Book Quote in an Editorial Article

Reference a book by its `bookId` in your article content:

```tsx
{
  id: 'sprint-quote',
  type: 'quote',
  metadata: {
    bookId: 'cmkmyw0xj0001vx6tgjpgy3rx' // Sprint book
  }
}
```

To add quotes to other books, update them via the admin panel at `/admin/books` or through the API.

---

## How to Add Book Data

### Step 1: Edit via the admin panel

Go to `/admin/books`, click **Edit** on the book you want to update, and fill in:

- `quote` — a brief excerpt (a sentence or two — see the character counter). Longer passages aren't citation, they're reproduction.
- `page` — page number the quote appears on (required if you set a quote)
- `publisher` — publisher name (required if you set a quote)
- `publisherLink` — a link where a reader can actually get the book

Copy the book's `id` from the inventory table for use in articles/stories.

Prisma Studio (`npm run db:studio`) still works for bulk edits if you'd rather work in a spreadsheet-like view, but the admin panel is now the primary path and enforces the citation requirements above.

### Step 2: Use the book ID in your editorial articles

```tsx
{
  type: 'quote',
  metadata: {
    bookId: 'cmkmyw7yk000zvx6txy3fd93d' // Your book ID
  }
}
```