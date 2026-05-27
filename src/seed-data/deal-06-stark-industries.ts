import { type DealSeed, USER_ID, transcriptBody } from './deal-types';

// Deal 06 — Stark Industries — Year 3 renewal + 30% seat expansion, multi-year commit in flight
//
// Themes: pricing tier / volume discount, renewal lock / multi-year commit,
//         procurement involvement, expansion (30% seats), ROI case
// Stage: closing  |  Amount: $410K  |  Status: closing

export const deal: DealSeed = {
  account: {
    id: '00000000-0000-0000-0000-aaaa00000006',
    userId: USER_ID,
    name: 'Stark Industries',
    website: 'stark.example',
    externalId: 'sf-acct-006',
    providerMetadata: { industry: 'manufacturing', employee_count: 8000 },
  },

  opportunity: {
    id: '00000000-0000-0000-0000-bbbb00000006',
    userId: USER_ID,
    accountId: '00000000-0000-0000-0000-aaaa00000006',
    name: 'Stark — Year 3 Renewal + Expansion',
    description:
      'Existing customer renewal entering year 3, paired with a 30% seat expansion across the engineering org. Multi-year commit under discussion in exchange for a renewal lock on pricing.',
    stage: 'closing',
    amount: 41000000, // $410K
    closeDate: new Date('2026-06-15T00:00:00Z'),
    nextStep:
      'Send final order form for 3-year commit + 30% seat expansion to CIO, today.',
    probability: 85,
    isClosed: false,
    isWon: false,
    stateOfDealStatus: 'closing',
    stateOfDeal:
      'Existing customer renewal plus a 30% seat expansion; multi-year commit under discussion in exchange for renewal lock pricing. Procurement involvement is signed off and the CIO is finalizing.',
    isVisible: true,
    emailDomains: ['stark.example'],
  },

  contacts: [
    {
      id: '00000000-0000-0000-0000-cccc06000001',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000006',
      firstName: 'Pepper',
      lastName: 'Pottsworth',
      email: 'pepper.pottsworth@stark.example',
    },
    {
      id: '00000000-0000-0000-0000-cccc06000002',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000006',
      firstName: 'Harold',
      lastName: 'Hogan',
      email: 'harold.hogan@stark.example',
    },
  ],

  emails: [
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      accountId: '00000000-0000-0000-0000-aaaa00000006',
      contactId: '00000000-0000-0000-0000-cccc06000001',
      occurredAt: new Date('2026-05-11T16:30:00Z'),
      subject: 'Stark — Year 3 renewal proposal w/ 3-year commit pricing',
      bodyText:
        "Pepper — attaching the updated proposal covering the year 3 renewal plus the 30% seat expansion we walked through on Friday. The 3-year commit gets you a full renewal lock at the current pricing tier, and the volume discount on the expansion seats brings the blended unit price down ~12%. Happy to jump on a quick call this week if you want to walk through the math with Harold before procurement involvement wraps. Otherwise the order form is ready whenever you're set.",
      fromAddress: 'rep@findtempo.co',
      toAddresses: ['pepper.pottsworth@stark.example'],
      ccAddresses: ['harold.hogan@stark.example'],
      direction: 'outbound',
      threadId: 'thread-stark-001',
      hasAttachments: true,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      accountId: '00000000-0000-0000-0000-aaaa00000006',
      contactId: '00000000-0000-0000-0000-cccc06000001',
      occurredAt: new Date('2026-05-14T13:12:00Z'),
      subject: 'Re: Stark — Year 3 renewal proposal w/ 3-year commit pricing',
      bodyText:
        "Got it, thanks. Budget is confirmed on our side for the renewal + the 30% seat expansion at the proposed pricing tier. The ROI case from the QBR made the multi-year commit easy to sign off internally — the year 1-2 numbers speak for themselves. I'll loop back once procurement has the final order form in hand.",
      fromAddress: 'pepper.pottsworth@stark.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-stark-001',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      accountId: '00000000-0000-0000-0000-aaaa00000006',
      contactId: '00000000-0000-0000-0000-cccc06000002',
      occurredAt: new Date('2026-05-18T10:05:00Z'),
      subject: 'Procurement sign-off — Stark renewal + expansion',
      bodyText:
        "Quick note that procurement involvement on our side is officially wrapped — MSA addendum reviewed, the volume discount schedule checks out against our benchmarks, and we're cleared to execute the 3-year renewal lock. Pepper has the order form on her desk for final signature. Appreciate the patience working through our process.",
      fromAddress: 'harold.hogan@stark.example',
      toAddresses: ['rep@findtempo.co'],
      ccAddresses: ['pepper.pottsworth@stark.example'],
      direction: 'inbound',
      threadId: 'thread-stark-002',
      hasAttachments: false,
    },
  ],

  transcripts: [
    {
      id: '00000000-0000-0000-0000-eeee06000001',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-04-24T15:00:00Z'),
      title: 'Stark — QBR',
      source: 'gong',
      duration: 55 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'harold.hogan@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks for making time — wanted to walk through year 1-2 usage and frame the ROI case before we get into renewal mechanics. Headline numbers: adoption is at 92% of provisioned seats and you're running about 4x the workflow volume we projected at signing.",
        },
        {
          speaker: 'buyer',
          text: "Yeah, those numbers track with what my team is seeing. The ROI case has basically made itself internally — we measured roughly 11 hours saved per engineer per month, and the finance team finally stopped asking me to justify the line item. We used to pull this data into Tableau for the monthly reports but the manual refresh was the bottleneck; replacing that Tableau workflow alone justified half the cost in the first quarter.",
        },
        {
          speaker: 'seller',
          text: "Good. That's why I wanted to tee up the expansion conversation now rather than at renewal — you're past capacity on the current tier and the engineering org is growing into Q3. We're seeing a ~30% seat expansion as the right shape.",
        },
        {
          speaker: 'buyer',
          text: "That matches what Pepper and I were modeling. The CIO is going to want to see the multi-year commit option side-by-side with the annual — if the renewal lock is meaningful, we'll seriously consider 3 years.",
        },
        {
          speaker: 'seller',
          text: "Understood. I'll put together two scenarios: straight annual renewal at the new seat count, and a 3-year commit with a renewal lock holding today's pricing tier across the full term. Volume discount kicks in harder on the latter.",
        },
        {
          speaker: 'buyer',
          text: "Perfect. Harold will be the point person once procurement involvement starts — he already has the MSA from last cycle, so it should be lightweight. Let's aim to have something in front of the CIO before mid-May.",
        },
        {
          speaker: 'seller',
          text: 'Works. I\'ll have the numbers over by end of week and we can schedule a pricing review before you take it upstairs.',
        },
      ]),
      summary:
        'QBR reviewed strong year 1-2 usage and a clear ROI case (11 hrs/eng/month saved, 92% seat utilization). Buyer aligned on 30% seat expansion and asked for a 3-year commit scenario with renewal lock against annual.',
      enhancedNotes: 'CIO wants annual vs 3-year side-by-side before approving.',
      externalId: 'gong-call-60601',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000002',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-05-08T17:00:00Z'),
      title: 'Stark — Renewal pricing review',
      source: 'zoom',
      duration: 40 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'harold.hogan@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Pulled up the two scenarios. Annual renewal at the expanded seat count lands at $445K. The 3-year commit with renewal lock comes in at $410K year one, flat across the term — the volume discount on the expansion seats is what closes most of the gap.",
        },
        {
          speaker: 'buyer',
          text: "So the multi-year commit is net cheaper in year one AND locks the pricing tier? That's the easy sell to the CIO. What's the catch on the renewal lock — any usage caps?",
        },
        {
          speaker: 'seller',
          text: "No usage caps. The lock holds the per-seat unit price across all three years; you can add seats above the 30% expansion at the same locked tier. The only commitment is the seat floor — you can't drop below the new baseline.",
        },
        {
          speaker: 'buyer',
          text: "Floor's fine, we're growing into it anyway. Harold — anything from procurement that would block the 3-year shape?",
        },
        {
          speaker: 'unknown',
          text: "Procurement involvement is straightforward on this one. The MSA already permits multi-year, and the volume discount documentation is what legal will want to see attached to the order form. Give me the pricing schedule and I can run it in parallel with the CIO review.",
        },
        {
          speaker: 'seller',
          text: "I'll send the order form and the pricing schedule together this week. If procurement signs off by mid-May, the CIO can finalize before the June close date without anyone rushing.",
        },
        {
          speaker: 'buyer',
          text: "That timing works. Send it over — we'll keep things moving on our end.",
        },
      ]),
      summary:
        '40-min pricing review comparing annual renewal ($445K) vs 3-year commit with renewal lock ($410K flat). Volume discount on expansion seats drives the gap; procurement involvement deemed lightweight given existing MSA.',
      enhancedNotes: 'CIO finalizing; order form + pricing schedule to follow this week.',
      externalId: 'zoom-call-60602',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000003',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-01-15T16:00:00Z'),
      title: 'Stark — CS check-in (Jan)',
      source: 'gong',
      duration: 22 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Quick check-in to kick off the year — wanted to see how the holiday freeze went and whether anything broke on the way back online.",
        },
        {
          speaker: 'buyer',
          text: "Smooth, honestly. Adoption ticked up over the freeze because folks were caught up on tickets and had time to onboard into the workflows. We're at 89% of provisioned seats active weekly.",
        },
        {
          speaker: 'seller',
          text: "That's a healthy number heading into the renewal cycle. Anything on the roadmap side you want me to pull forward?",
        },
        {
          speaker: 'buyer',
          text: "The bulk-export endpoint is the big one for our plant-IT team. They keep pinging me about it. Otherwise quiet.",
        },
        {
          speaker: 'seller',
          text: "I'll get a status from product and circle back. Anything stirring on the budget side I should know about before the Q1 QBR?",
        },
        {
          speaker: 'buyer',
          text: "Not yet — finance is still finalizing FY26. But the ROI case from year one is locked in their heads, so I don't expect drama.",
        },
      ]),
      summary:
        'Informal January check-in — 89% weekly active seats, no incidents over holiday freeze, bulk-export endpoint flagged as the open ask. No budget concerns surfaced ahead of Q1 QBR.',
      enhancedNotes: 'Pull bulk-export ETA from product before Q1 QBR.',
      externalId: 'gong-call-60603',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000004',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-01-28T22:00:00Z'),
      title: 'Stark — Champion 1:1 w/ CIO',
      source: 'granola',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Appreciate the late slot — figured a 1:1 would be easier than getting it on the official calendar. How's the reorg landing?",
        },
        {
          speaker: 'buyer',
          text: "Messy but on schedule. The engineering side is growing faster than HR forecast, which is partly why I wanted to talk before the QBR. We're going to need more seats — probably a real expansion, not just a top-up.",
        },
        {
          speaker: 'seller',
          text: "Ballpark? I'd rather come in prepared than guess in the QBR room.",
        },
        {
          speaker: 'buyer',
          text: "Working assumption is 30% over current. Most of it engineering, some product ops. I'd like to bundle it with the renewal so I'm not doing two procurement cycles.",
        },
        {
          speaker: 'seller',
          text: "Makes sense. That changes the conversation — at that volume you should be looking at a multi-year commit with a renewal lock on the unit price, not a straight annual.",
        },
        {
          speaker: 'buyer',
          text: "That was my instinct too. I don't want to do this dance every twelve months when we know we're going to keep growing into it.",
        },
        {
          speaker: 'seller',
          text: "Good. I'll model out the expansion scenarios before the QBR so we're not improvising in front of Harold.",
        },
      ]),
      summary:
        'Informal champion 1:1 — CIO surfaced ~30% seat expansion as the working assumption and wants it bundled with renewal. Aligned to model multi-year commit with renewal lock ahead of the QBR.',
      enhancedNotes: 'Bring expansion + multi-year scenarios to Q1 QBR — surprise-free.',
      externalId: 'granola-note-60604',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000005',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-02-05T15:00:00Z'),
      title: 'Stark — Q1 QBR',
      source: 'gong',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'harold.hogan@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Q1 QBR — going to keep it tight. Three things: usage update, ROI case refresh against the year-one baseline, and a forward look at the renewal cycle.",
        },
        {
          speaker: 'buyer',
          text: "Sounds good. The ROI case is the one I want to nail down — finance is going to ask me for refreshed numbers next month.",
        },
        {
          speaker: 'seller',
          text: "Pulled them this morning. Hours saved per engineer per month climbed from 9 in year one to 11 in year two. Ticket cycle time is down 38% across the workflows we instrumented.",
        },
        {
          speaker: 'unknown',
          text: "Those are the numbers I want on the slide. Can you send the underlying methodology too? Procurement involvement is going to want to see how we measured it before they sign on a multi-year commit.",
        },
        {
          speaker: 'seller',
          text: "Will do. On the forward look — based on Pepper's expansion sizing, we're talking a 30% seat lift bundled with the year 3 renewal. I'll bring full pricing tier options to the next session.",
        },
        {
          speaker: 'buyer',
          text: "Bring the volume discount detail too — that's the lever I'll use to justify the multi-year shape internally.",
        },
        {
          speaker: 'seller',
          text: "Noted. Anything else before we wrap?",
        },
        {
          speaker: 'buyer',
          text: "No — keep the bulk-export endpoint moving and we're good. Talk soon.",
        },
      ]),
      summary:
        'Q1 QBR — refreshed ROI case (11 hrs/eng/month, -38% ticket cycle time) and confirmed the year 3 renewal will bundle a 30% seat expansion. Procurement wants methodology docs; CIO wants pricing tier + volume discount detail next.',
      enhancedNotes: 'Send ROI methodology PDF + draft pricing tier scenarios.',
      externalId: 'gong-call-60605',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000006',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-02-18T16:00:00Z'),
      title: 'Stark — Year 2 anniversary review',
      source: 'gong',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'harold.hogan@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Two years in — figured we'd zoom out before getting into the renewal mechanics. The headline is that you've doubled active workflow volume year over year on the same seat count, which is the cleanest ROI case I can give finance.",
        },
        {
          speaker: 'buyer',
          text: "And that's with the engineering team being conservative. Once we close the seat expansion we'll see another step change.",
        },
        {
          speaker: 'seller',
          text: "Exactly the framing. Which is also why I want to push for the multi-year commit shape — your unit economics are going to get better, not worse, but only if we lock the pricing tier before the expansion seats land.",
        },
        {
          speaker: 'unknown',
          text: "Procurement involvement is going to want a written commitment on the renewal lock. As in: the per-seat number doesn't move for the term, including on any seats we add above the expansion baseline.",
        },
        {
          speaker: 'seller',
          text: "That's exactly how we structure it. I'll show you the contract language at the pricing review — there's a specific renewal lock clause that holds the unit price for the full commit term.",
        },
        {
          speaker: 'buyer',
          text: "Good. Let's keep the momentum — what's the next concrete step?",
        },
        {
          speaker: 'seller',
          text: "Renewal kickoff in late March, then pricing review in early May, then order form. I'll send a calendar shell this week.",
        },
      ]),
      summary:
        'Year-2 anniversary review — workflow volume doubled YoY on flat seats, framed as the ROI case for the year 3 renewal. Aligned on multi-year commit with explicit renewal lock contract language; procurement wants it in writing.',
      enhancedNotes: 'Walk renewal lock clause at pricing review; send sequence calendar shell.',
      externalId: 'gong-call-60606',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000007',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-03-03T17:00:00Z'),
      title: 'Stark — Expansion sizing call #1',
      source: 'gong',
      duration: 50 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Want to take a real run at sizing the expansion today — last time we threw around 30% but I'd like to ground it in actual headcount.",
        },
        {
          speaker: 'buyer',
          text: "Fair. Current provisioned is 1,100 seats. Engineering org is going from 820 to 1,050 by end of Q3. Product ops adds another 60. So we're looking at roughly 290 net new, which is the 30% expansion you'd modeled.",
        },
        {
          speaker: 'seller',
          text: "Clean math. Are all of those licensed users, or do some of them sit in observer roles?",
        },
        {
          speaker: 'buyer',
          text: "All licensed. The observer pattern doesn't really work for our team — they want the workflow tooling end-to-end or not at all.",
        },
        {
          speaker: 'seller',
          text: "Good. At that volume you cross the next pricing tier threshold, so the per-seat unit price actually drops on the expansion seats — that's the volume discount lever I want to apply across the whole base, not just the new seats.",
        },
        {
          speaker: 'buyer',
          text: "That's the part that needs to be airtight when I take it to the CIO. If the volume discount only applies to the expansion seats and not the existing base, the optics are bad internally.",
        },
        {
          speaker: 'seller',
          text: "Understood. We'll structure it as a blended unit price across the full population — every seat at the new tier. I'll bring the numbers to the next session.",
        },
        {
          speaker: 'buyer',
          text: "Perfect. Loop Harold in on the next one — once we have real numbers, procurement involvement starts in earnest.",
        },
      ]),
      summary:
        'Expansion sizing call — confirmed 290 net new seats (~30% expansion) across engineering + product ops. Crosses the next pricing tier; agreed the volume discount applies as a blended unit price across the full population, not just expansion seats.',
      enhancedNotes: 'Loop Harold in next call; bring blended-price scenario.',
      externalId: 'gong-call-60607',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000008',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-03-12T15:30:00Z'),
      title: 'Stark — Expansion budget walkthrough',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'harold.hogan@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Bringing the blended numbers from last time. On 1,390 total seats at the new pricing tier, you land at roughly $445K annual. That's including the 30% expansion and the volume discount applied across the full base.",
        },
        {
          speaker: 'buyer',
          text: "And the year 2 number on year-over-year increases?",
        },
        {
          speaker: 'seller',
          text: "On a straight annual that would step up — call it 6% inflator. On a multi-year commit, it's flat. Which is the whole point of the renewal lock conversation.",
        },
        {
          speaker: 'unknown',
          text: "Budget on our side is sized to roughly $420K for the renewal line in FY26. We're a little tight against the annual number — the multi-year commit shape is going to be easier to defend.",
        },
        {
          speaker: 'seller',
          text: "That tracks. The 3-year commit lands at $410K year one flat — under your budget envelope, with the renewal lock pinning that number for years 2 and 3 as well.",
        },
        {
          speaker: 'buyer',
          text: "That's the version I want to take to the CIO. Harold, can you start the procurement involvement track now so we're not the bottleneck in May?",
        },
        {
          speaker: 'unknown',
          text: "Already started. I have the MSA pulled up — once the order form is in hand I can run the review in parallel with finance sign-off.",
        },
      ]),
      summary:
        'Expansion budget walkthrough — $445K annual vs $410K flat under a 3-year commit. Multi-year shape fits under the $420K FY26 envelope; procurement involvement started in parallel with finance sign-off.',
      enhancedNotes: 'CIO will see 3-year shape first; Harold running MSA review in parallel.',
      externalId: 'zoom-call-60608',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000009',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-03-18T21:00:00Z'),
      title: 'Internal — Stark forecast call',
      source: 'granola',
      duration: 25 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'vp-sales@findtempo.co',
      ],
      scope: 'internal',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Walking through Stark for forecast — calling it $410K at 75% probability for the June close. Existing customer, 30% seat expansion bundled with year 3 renewal.",
        },
        {
          speaker: 'unknown',
          text: "Why 75 and not higher? It sounds like the buyer is bought in.",
        },
        {
          speaker: 'seller',
          text: "The CIO is bought in on the shape — multi-year commit with the renewal lock. The 75 reflects procurement involvement timing more than commercial risk. Harold is fast but he's also thorough, and we have a hard close at June 15.",
        },
        {
          speaker: 'unknown',
          text: "What's the downside scenario — they drop to annual instead of 3-year?",
        },
        {
          speaker: 'seller',
          text: "Downside is annual at $445K, which is actually a bigger number — but I lose the renewal lock and we're back to a renewal cycle in 12 months. The ROI case from year 1-2 is strong enough that I don't see them walking away from the expansion.",
        },
        {
          speaker: 'unknown',
          text: "Push the probability to 80 next week if procurement gives a clean signal. Anything you need from me?",
        },
        {
          speaker: 'seller',
          text: "Maybe an executive sponsor call before signature — their CIO likes the optics of seeing our VP in the room when they're locking in a 3-year shape.",
        },
        {
          speaker: 'unknown',
          text: "Set it up. I'll make myself available.",
        },
      ]),
      summary:
        'Internal forecast review — Stark called at $410K, 75% probability for June close. Risk is procurement timing, not commercial. VP agreed to join an executive sponsor call before signature.',
      enhancedNotes: 'Bump to 80% once procurement signals; set up VP exec sponsor call.',
      externalId: 'granola-note-60609',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000010',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-03-26T16:00:00Z'),
      title: 'Stark — Renewal kickoff',
      source: 'gong',
      duration: 50 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'harold.hogan@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Formal renewal kickoff — wanted to align on the path to June 15 close. Plan is: procurement intake next week, multi-year commit walkthrough mid-April, ROI review late April, order form early June.",
        },
        {
          speaker: 'buyer',
          text: "That sequence works. The only piece I'd flag is the procurement intake — Harold's process has a hard 30-day clock once we hand him the formal package.",
        },
        {
          speaker: 'unknown',
          text: "30 business days. Which is why I'd rather kick off procurement involvement before mid-April, not after. Earlier is better.",
        },
        {
          speaker: 'seller',
          text: "Then let's tee up the procurement intake call for next week. I'll bring the formal package — pricing tier schedule, volume discount documentation, renewal lock clause, and the proposed multi-year commit shape.",
        },
        {
          speaker: 'buyer',
          text: "On the expansion side — anything you need from us to firm up the seat count?",
        },
        {
          speaker: 'seller',
          text: "Just a final headcount confirmation from your HR partner before mid-May. Otherwise the 1,390 number from the budget walkthrough holds.",
        },
        {
          speaker: 'unknown',
          text: "I'll get HR to send the confirmation to my office by April 30 — that gives me time to sync it into the order form.",
        },
        {
          speaker: 'seller',
          text: "Perfect. Anything else blocking us today?",
        },
        {
          speaker: 'buyer',
          text: "No — let's run the play.",
        },
      ]),
      summary:
        'Renewal kickoff aligned the path to June 15 close: procurement intake next week, multi-year commit walkthrough mid-April, ROI review late April, order form early June. HR headcount confirmation due April 30.',
      enhancedNotes: 'Schedule procurement intake; assemble formal package this week.',
      externalId: 'gong-call-60610',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000011',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-04-02T14:00:00Z'),
      title: 'Stark — Procurement intake (RFP)',
      source: 'zoom',
      duration: 65 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'harold.hogan@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'unknown',
          text: "Walking you through our intake — this is the procurement involvement piece I flagged at kickoff. I'll record the formal RFP responses as we go.",
        },
        {
          speaker: 'seller',
          text: "Sounds good. I've sent over the pricing tier schedule, volume discount table, renewal lock clause language, and the three-year commit term sheet. What's your first question?",
        },
        {
          speaker: 'unknown',
          text: "Start with the renewal lock — I want to understand what triggers a re-rate. If you change your published pricing tier mid-term, what happens to our unit price?",
        },
        {
          speaker: 'seller',
          text: "Renewal lock language explicitly insulates you. If we raise list prices in year two, your unit price doesn't move. If we lower them, the lock holds at the contracted rate — but you can request a re-rate down at the anniversary, which we've accommodated for other multi-year accounts.",
        },
        {
          speaker: 'unknown',
          text: "Good. Next — the volume discount. You said it applies as a blended unit price across the full population. What if we drop seats below the expansion baseline mid-term?",
        },
        {
          speaker: 'seller',
          text: "The seat floor in the commit is the expansion baseline — 1,390 seats. You can go above it freely at the same unit price; you can't go below it without re-rating. That's standard for the multi-year commit shape.",
        },
        {
          speaker: 'unknown',
          text: "Fine. Last big one — security review. Anything material changed in your SOC2 since last cycle?",
        },
        {
          speaker: 'seller',
          text: "We added SOC2 Type II in November and got our ISO 27001 certified in February. I'll send both reports.",
        },
        {
          speaker: 'unknown',
          text: "That speeds my review materially. Send the reports and I'll have a procurement red-line back within 10 business days.",
        },
        {
          speaker: 'seller',
          text: "Will do. Thanks for the focused session.",
        },
      ]),
      summary:
        'Formal procurement intake / RFP — Harold walked the renewal lock language, volume discount blended-price structure, and seat floor mechanics. Security reviewed against new SOC2 Type II + ISO 27001. Red-line expected within 10 business days.',
      enhancedNotes: 'Send SOC2 + ISO reports today; expect red-line in 10 business days.',
      externalId: 'zoom-call-60611',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000012',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-04-10T16:00:00Z'),
      title: 'Stark — Multi-year commit walkthrough (1/2/3 yr)',
      source: 'gong',
      duration: 55 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'harold.hogan@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Walking the three multi-year commit options side by side. Annual: $445K, no lock, standard 6% inflator at anniversary. Two-year: $425K flat, renewal lock for the term. Three-year: $410K flat, renewal lock for the full term plus a volume discount kicker on any seats added above the floor.",
        },
        {
          speaker: 'buyer',
          text: "Walk me through the kicker again — that wasn't in the last deck.",
        },
        {
          speaker: 'seller',
          text: "On the three-year only: any seats you add above the 1,390 floor get an additional 5% off the locked unit price. So as you grow into the commit, your blended cost actually drops below the day-one number.",
        },
        {
          speaker: 'buyer',
          text: "That's the kind of optics I can sell upstairs. Harold — anything in the kicker that worries procurement?",
        },
        {
          speaker: 'unknown',
          text: "Not on its face. I want to see the kicker reflected in the order form schedule so it's not handshake-only. As long as it's documented, it's clean for procurement involvement.",
        },
        {
          speaker: 'seller',
          text: "It'll be a separate schedule referenced in the order form. The legal team has already approved the template for two other multi-year accounts.",
        },
        {
          speaker: 'buyer',
          text: "Then I think we have our shape. Three-year commit with renewal lock and the expansion kicker. Send the updated proposal — I'll get CIO sign-off before the ROI review.",
        },
        {
          speaker: 'seller',
          text: "Going out today.",
        },
      ]),
      summary:
        'Multi-year commit walkthrough — 1-yr ($445K + 6% inflator), 2-yr ($425K flat), 3-yr ($410K flat + 5% expansion-seat kicker). Buyer aligned on the 3-yr shape; kicker to be documented as a referenced schedule on the order form.',
      enhancedNotes: 'CIO sign-off targeted before April 17 ROI review.',
      externalId: 'gong-call-60612',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000013',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-04-17T15:00:00Z'),
      title: 'Stark — ROI / value review',
      source: 'gong',
      duration: 50 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'harold.hogan@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "ROI review — this is the version of the deck I expect you to bring to your CIO and to finance. Three sections: hours saved, cycle-time reduction, and a forward-looking expansion projection.",
        },
        {
          speaker: 'buyer',
          text: "Walk us through the headline numbers — Harold needs to corroborate them for procurement involvement on the multi-year commit.",
        },
        {
          speaker: 'seller',
          text: "Hours saved: 11 per engineer per month, up from 9 in year one. Cycle time: 38% reduction across instrumented workflows. Dollar value at your fully-loaded engineering cost: $2.1M annualized.",
        },
        {
          speaker: 'unknown',
          text: "And the methodology behind that $2.1M — what's the loaded-cost assumption?",
        },
        {
          speaker: 'seller',
          text: "Your HR partner gave us $165K fully loaded as the engineering average. Eleven hours a month times 820 engineers times the loaded hourly rate. The methodology is in the appendix and matches what I sent after the Q1 QBR.",
        },
        {
          speaker: 'unknown',
          text: "Numbers tie out. That ROI case is what makes the multi-year commit defensible internally.",
        },
        {
          speaker: 'seller',
          text: "Forward-looking — once the 30% expansion lands, the same model projects $2.7M annualized in year three. That's the chart the CIO is going to want.",
        },
        {
          speaker: 'buyer',
          text: "It is. Send the editable deck and I'll have it in front of him by Monday.",
        },
      ]),
      summary:
        'ROI value review — 11 hrs/eng/month saved, 38% cycle-time reduction, $2.1M annualized today scaling to $2.7M post-expansion. Methodology validated against HR loaded-cost figure. Editable deck going to CIO for signature path.',
      enhancedNotes: 'Send editable ROI deck; CIO review targeted for Monday.',
      externalId: 'gong-call-60613',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000014',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-04-30T17:00:00Z'),
      title: 'Stark — Reference call with prospect',
      source: 'google_meet',
      duration: 35 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'rep@findtempo.co',
        'prospect@oscorp.example',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Thanks Pepper for taking this — quick intro: this is the engineering ops lead at a prospect we're working with on a similar shape. They wanted to hear from an in-flight customer before signing.",
        },
        {
          speaker: 'buyer',
          text: "Happy to. Ask me whatever you want — I'll be honest, both directions.",
        },
        {
          speaker: 'unknown',
          text: "Appreciate it. First question — what was the implementation actually like? Vendor decks always look smooth.",
        },
        {
          speaker: 'buyer',
          text: "First six weeks were the messy part. We underestimated change management on the workflows. Once we got past that, the tool basically disappeared into the background, which is the highest compliment I can give it.",
        },
        {
          speaker: 'unknown',
          text: "And the ROI case — is the 11-hours-per-engineer number real, or is that a vendor slide?",
        },
        {
          speaker: 'buyer',
          text: "It's real, and we measured it ourselves before signing the renewal. Finance audited the methodology. That's why we're doing a 3-year multi-year commit with the renewal lock — the numbers gave us cover to lock it in.",
        },
        {
          speaker: 'unknown',
          text: "Last one — how did procurement involvement go on your side? Anything they pushed back on?",
        },
        {
          speaker: 'buyer',
          text: "Cleanest renewal we've run. Volume discount terms were transparent, renewal lock clause was airtight, and the security artifacts they sent over were current. Honestly, our procurement team was the easy part this time.",
        },
        {
          speaker: 'seller',
          text: "I'll let you two finish the conversation offline if it's useful. Pepper — thanks again.",
        },
      ]),
      summary:
        'Reference call — Stark CIO walked a prospect through implementation reality, validated the 11 hrs/eng ROI methodology, and described procurement involvement as the easy part. Strong endorsement of the multi-year commit + renewal lock shape.',
      enhancedNotes: 'Strong reference; thank-you note + reference credit to Pepper.',
      externalId: 'meet-call-60614',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000015',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-05-05T22:00:00Z'),
      title: 'Internal — Stark deal review',
      source: 'granola',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'vp-sales@findtempo.co',
        'deal-desk@findtempo.co',
      ],
      scope: 'internal',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Deal review on Stark — running through the order form before it goes out. Shape is the 3-year multi-year commit, $410K flat, renewal lock for the full term, blended volume discount, 5% expansion kicker on seats above the 1,390 floor.",
        },
        {
          speaker: 'unknown',
          text: "Deal desk question — is the expansion kicker schedule template-clean or one-off?",
        },
        {
          speaker: 'seller',
          text: "Template-clean. Same schedule we used for two other multi-year accounts last quarter. Legal has already approved the language.",
        },
        {
          speaker: 'unknown',
          text: "Good. Forecast wise — you're calling 85% now?",
        },
        {
          speaker: 'seller',
          text: "Yes. Procurement involvement is officially wrapped on their side as of last week, the CIO has sign-off internally, and the order form goes out after the executive sponsor call. June 15 close is realistic.",
        },
        {
          speaker: 'unknown',
          text: "Any landmines you're watching?",
        },
        {
          speaker: 'seller',
          text: "One — the HR headcount confirmation needs to come in matching the 1,390 floor. If it shifts materially, we re-rate the floor and there's a small chance Harold reopens the seat-floor language. Low probability but non-zero.",
        },
        {
          speaker: 'unknown',
          text: "Worth a heads-up at the exec sponsor call. Anything else?",
        },
        {
          speaker: 'seller',
          text: "No — the ROI case sold itself on the value review. We're at the boring-execution stage.",
        },
      ]),
      summary:
        'Internal deal review — Stark order form sequence cleared by deal desk. Forecast moved to 85% based on procurement wrap and CIO sign-off. One residual risk: HR headcount confirmation must match the 1,390 floor.',
      enhancedNotes: 'Flag headcount-floor risk at exec sponsor call.',
      externalId: 'granola-note-60615',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000016',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-05-12T16:00:00Z'),
      title: 'Stark — Executive sponsor call',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'harold.hogan@stark.example',
        'rep@findtempo.co',
        'vp-sales@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'unknown',
          text: "Pepper, Harold — appreciate the time. My VP wanted to be in the room before we close out the 3-year shape; figured it's the right moment to align at the senior level.",
        },
        {
          speaker: 'seller',
          text: "Pepper, the headline from our side: this is the cleanest multi-year commit we've structured this year. The renewal lock holds your pricing tier across the full term, the volume discount is blended across your full base, and the expansion kicker drops your blended cost as you grow.",
        },
        {
          speaker: 'buyer',
          text: "I appreciate it. From our side — the ROI case is the cleanest I've ever taken to my CFO. Year-on-year doubling of workflow volume on flat seats, $2.1M annualized today, projected $2.7M after the 30% expansion lands. That math is what gave me cover for the 3-year shape.",
        },
        {
          speaker: 'unknown',
          text: "Procurement involvement is wrapped on our end. The MSA addendum is reviewed, the volume discount schedule checks against our benchmarks, and the renewal lock clause is exactly what I asked for. We're not the bottleneck.",
        },
        {
          speaker: 'seller',
          text: "Then the path to close is — order form to Pepper this week, signature targeted before June 15. Anything else either of you needs from us at the senior level?",
        },
        {
          speaker: 'buyer',
          text: "Just one — once the order form is signed, I want the implementation planning kickoff scheduled fast. The expansion seats land in Q3 and I don't want a gap.",
        },
        {
          speaker: 'seller',
          text: "We'll have implementation planning scheduled the same week as signature. CS will lead it; I'll stay close to make sure the handoff is clean.",
        },
        {
          speaker: 'buyer',
          text: "Then we're aligned. Thanks for coming, glad we did this.",
        },
      ]),
      summary:
        'Executive sponsor call — VP joined; CIO confirmed ROI case carried the multi-year commit internally and procurement is wrapped. Path to June 15 signature locked. CIO requested implementation planning kickoff the same week as signature.',
      enhancedNotes: 'Schedule implementation planning kickoff for signature week.',
      externalId: 'zoom-call-60616',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000017',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-05-22T15:00:00Z'),
      title: 'Stark — Implementation planning (expansion)',
      source: 'google_meet',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'rep@findtempo.co',
        'cs-lead@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Implementation planning for the 30% expansion — handing the planning lead to CS but staying in the room. Goal today is to lock the wave plan so the new seats are productive before Q3.",
        },
        {
          speaker: 'unknown',
          text: "Three waves. Wave one: 120 seats in the engineering platform team, week of June 22. Wave two: 110 seats across the application engineering pods, mid-July. Wave three: 60 seats in product ops, early August.",
        },
        {
          speaker: 'buyer',
          text: "That sequencing matches our headcount ramp. The platform team is hiring fastest so they should be wave one — good catch.",
        },
        {
          speaker: 'unknown',
          text: "Each wave gets a dedicated CS pod for the first two weeks post-provisioning. Same playbook we used for your year-one rollout, but tighter since you already have the workflows established.",
        },
        {
          speaker: 'buyer',
          text: "Lighter touch is appropriate — my team knows the tool now. Just make sure the onboarding content is updated for the bulk-export endpoint, since that's the headline new capability the new hires will see.",
        },
        {
          speaker: 'unknown',
          text: "Already updated. We'll send a preview by end of next week.",
        },
        {
          speaker: 'seller',
          text: "And on the contract side — the wave plan gets attached as an appendix to the order form, so the expansion kicker tracking is unambiguous. Each wave's seats hit the floor on the provisioning date.",
        },
        {
          speaker: 'buyer',
          text: "Clean. Send the wave plan to Harold so he can sync it into the order form schedule.",
        },
      ]),
      summary:
        'Implementation planning for the 30% expansion — three-wave rollout (120 / 110 / 60 seats) timed to the engineering headcount ramp. Lighter-touch CS pods, updated onboarding content for bulk-export endpoint, wave plan attached to the order form for kicker tracking.',
      enhancedNotes: 'Send wave plan to Harold for order form appendix.',
      externalId: 'meet-call-60617',
    },
    {
      id: '00000000-0000-0000-0000-eeee06000018',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000006',
      occurredAt: new Date('2026-06-05T17:00:00Z'),
      title: 'Stark — Final order form walkthrough',
      source: 'gong',
      duration: 40 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'pepper.pottsworth@stark.example',
        'harold.hogan@stark.example',
        'rep@findtempo.co',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: "Final order form walkthrough — line by line so there are zero surprises at signature. 3-year commit, $410K flat year one, renewal lock holding the unit price across all three years.",
        },
        {
          speaker: 'unknown',
          text: "Section two — volume discount. Blended unit price across the full 1,390-seat population at the new pricing tier. Confirmed against our procurement involvement benchmarks last cycle. We're good.",
        },
        {
          speaker: 'seller',
          text: "Section three — expansion kicker schedule. 5% off the locked unit price for any seats added above the 1,390 floor, applied at provisioning. Wave plan from implementation planning is attached as Appendix B.",
        },
        {
          speaker: 'buyer',
          text: "Appendix B looks right — three waves, dates match what CS walked us through. The kicker tracking on each wave is exactly the way I want it documented.",
        },
        {
          speaker: 'unknown',
          text: "Section four — seat floor. 1,390 hard floor for the full term. Below that triggers a re-rate. Standard for the multi-year commit shape and consistent with what I redlined in the intake.",
        },
        {
          speaker: 'seller',
          text: "Section five — renewal lock clause. Unit price doesn't move on list-price increases; you retain the right to request a downward re-rate at each anniversary if our published tier drops below your locked rate.",
        },
        {
          speaker: 'buyer',
          text: "All clean. I'll route for signature this afternoon — should be back to you before the end of the week.",
        },
        {
          speaker: 'seller',
          text: "Appreciate it. Implementation planning is already on the calendar for the signature week.",
        },
      ]),
      summary:
        'Final order form walkthrough — line-by-line confirmation of the 3-year $410K commit, blended volume discount, expansion kicker schedule, 1,390 seat floor, and renewal lock clause. CIO routing for signature same day.',
      enhancedNotes: 'Order form routed for signature; close on track for June 15.',
      externalId: 'gong-call-60618',
    },
  ],
};
