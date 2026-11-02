import { STATES } from "@/lib/states";

export interface Guide {
  slug: string;
  title: string;
  description: string;
  readingMinutes: number;
  updated: string;
  body: string; // simple markdown subset: ##, ###, paragraphs, - lists, **bold**, [text](href)
}

const stateChecklist = STATES.filter((s) => s.coverage !== "planned")
  .map((s) => `- **${s.name}** (${s.authority}): numbers look like \`${s.regNumberExample}\`. Official search: [${new URL(s.portalUrl).host}](${s.projectSearchUrl}). Or paste the number into Rera Scanner.`)
  .join("\n");

export const GUIDES: Guide[] = [
  {
    slug: "how-to-check-a-rera-project",
    title: "How to check a RERA project before booking (10-minute checklist)",
    description: "The ten things to verify on the official RERA record before you pay a booking amount, and what each one tells you.",
    readingMinutes: 7,
    updated: "2026-10-15",
    body: `
Buying under construction is a bet on the promoter finishing on time. The RERA register is the only place the promoter has made that promise under penalty, so start there, not with the brochure.

## 1. Is the project registered at all?
Any project over 500 square metres or with more than eight units must be registered before it is advertised or sold. If the sales team cannot give you a registration number, walk away. Check the number on the state portal, not on a printout.

## 2. Does the registered name and promoter match the brochure?
Projects are often marketed under a brand name while the registered entity is a special-purpose company. That is normal, but the agreement must be with the registered promoter.

## 3. What completion date did the promoter declare?
This is the date that matters legally. Under Section 18, if possession is not given by the date in your agreement, you are entitled to interest for every month of delay or a refund with interest. Compare the registered date with what sales is telling you.

## 4. Has the date been extended?
Authorities can grant a one-year extension, and more under force majeure. Each extension is a signal that the original plan slipped. On Rera Scanner the possession timeline shows the original and revised dates side by side.

## 5. How many complaints, and how many are open?
Every complaint filed with the authority is public, with the order if decided. A handful of complaints on a 500-unit project is noise. Dozens of open delay complaints is a pattern.

## 6. Are quarterly progress reports being filed?
Promoters must update the register every quarter with construction progress and bookings. Missing updates mean the authority is not being told what is happening, and neither are you.

## 7. What is the registered carpet area?
Only carpet area may be used to sell. The area in the registration is binding; the area in the brochure is marketing. If they differ by more than a couple of percent, ask why in writing.

## 8. Is there an encumbrance on the land?
A mortgage on the project land is common and not alarming by itself, but it must be disclosed and your lender will care. An undisclosed charge is a problem.

## 9. What is the promoter's track record?
Look up every other project the same promoter has registered in the state. Did they finish on time? Rera Scanner shows the on-time rate and open complaints across the whole portfolio.

## 10. Is the escrow account in place?
Seventy percent of what you pay must go into a designated project account and be used only for that project. The bank name is on the registration. Ask to see that your payments are going there.

## Where to check
${stateChecklist}
`,
  },
  {
    slug: "how-to-read-a-rera-number",
    title: "How to read a RERA registration number",
    description: "Every state uses its own format. Here is how to tell which authority issued a number, what the parts mean, and the common fakes to watch for.",
    readingMinutes: 5,
    updated: "2026-09-02",
    body: `
There is no national RERA number format. Each authority designed its own, which is why a Maharashtra number looks nothing like a Gujarat one. The good news is that the format tells you which portal to verify on.

## The formats
${stateChecklist}

## What the parts mean
- **Maharashtra** numbers are a letter P and eleven digits. The first digits after P encode the division and district; the rest is a sequence. Agents have A numbers.
- **Gujarat** numbers are long paths: project/state/district/city/authority/sequence/date. The last six digits are the registration date (ddmmyy).
- **Karnataka** numbers start PRM/KA/RERA followed by codes for the district, the sequence, PR for project and the registration date in yymmdd form.
- **Uttar Pradesh** numbers are UPRERAPRJ followed by a sequence. Agents are UPRERAAGT.
- **West Bengal** numbers encode the region (NOR, SOU, KOL, HOW, HOO) and the year.

## Red flags
- A number that is not in the right format for the state the project is in.
- A number that belongs to a different, completed project reused for a new phase. Each phase needs its own registration.
- A registration that is lapsed or revoked. The portal will say so; the brochure will not.
- "RERA applied" or "RERA in process". Until the number is issued, the project cannot legally be advertised.

## Verify in seconds
Paste any number into the Rera Scanner search box. If we have it, you land on the project page with the official record and a link back to the portal. If we do not, we tell you which portal to check.
`,
  },
  {
    slug: "file-a-rera-complaint",
    title: "How to file a RERA complaint for delayed possession",
    description: "Who can file, what you can claim, what it costs, how long it takes, and how to build a complaint that the authority can decide quickly.",
    readingMinutes: 8,
    updated: "2026-08-20",
    body: `
If the possession date in your agreement for sale has passed, Section 18 of the Act gives you two choices: stay in the project and receive interest for every month of delay, or withdraw and receive your money back with interest. Either way the forum is the state RERA authority, not a civil court, and you do not need a lawyer to file.

## Who can file
Any allottee with an agreement for sale, a booking receipt or an allotment letter. Associations of allottees can file jointly, which the authorities encourage for large delays.

## What you can claim
- **Interest for delay** at the rate your state has notified, usually the State Bank of India's highest marginal cost of lending rate plus 2%, from the agreed possession date until actual possession.
- **Refund with interest** if you withdraw, at the same rate from each payment date.
- **Compensation** for other losses, which goes to the adjudicating officer rather than the authority.

## Before you file
- Download the project page from the state portal and from Rera Scanner showing the declared completion date, extensions and other complaints. Authorities move faster when the record is already in front of them.
- Collect your agreement, every payment receipt and every written promise about possession.
- Send a written demand to the promoter and keep proof of delivery. It is not mandatory everywhere but it strengthens the complaint.

## Filing
1. Create an account on the state portal's complaint section.
2. Choose the project from the register by registration number. This links your complaint to the project page, where it becomes visible to other buyers.
3. State the relief you want in one line: interest under Section 18, or refund with interest.
4. Upload the documents and pay the fee. Fees range from about ₹1,000 to ₹5,000 depending on the state.

## What happens next
The authority issues notice to the promoter, holds hearings (often online) and passes an order. Most states dispose of straightforward delay complaints within six to nine months. Orders are published on the portal. If the promoter does not comply, the order can be executed as a decree of a civil court, and non-compliance attracts daily penalties.

## Appeals
Either side may appeal to the state Real Estate Appellate Tribunal within 60 days. A promoter appealing against a refund order must first deposit the amount ordered.
`,
  },
  {
    slug: "what-does-lapsed-registration-mean",
    title: "What a lapsed or revoked RERA registration means for buyers",
    description: "Lapsed, expired and revoked are different things. What each means, what the promoter can and cannot do, and what you should do if your project is on the list.",
    readingMinutes: 4,
    updated: "2026-07-11",
    body: `
## Lapsed or expired
The registration ran past its declared completion date without completion and without an extension. The promoter may not advertise, market, book or sell any unit until the registration is revived, which requires applying for an extension and paying a penalty. Existing allottees' agreements remain valid, and the obligation to deliver and pay delay interest continues.

## Revoked
The authority cancelled the registration, usually for default on the Act's requirements, unfair practices or failure to file updates despite notices. Revocation is serious: the authority can freeze the project's escrow account, bar the promoter from accessing it and in some cases facilitate completion through the association of allottees.

## What to do
- Join or form the allottees' association. Many authorities will deal with the association directly on revoked projects.
- File a complaint for delay interest so your claim is on record before any remaining funds are distributed.
- Check whether other projects by the same promoter are also lapsed. On Rera Scanner the promoter page lists them.
- Do not pay further instalments against demands made while the registration is lapsed without written advice.

## How Rera Scanner treats it
A lapsed, expired or revoked status scores 5 on the possession component and loses 40 points on compliance, which puts most such projects in the Caution band regardless of anything else on the record.
`,
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
