import { type DealSeed, USER_ID, transcriptBody } from './deal-types';

// Deal 08 — Soylent Corp — lost to competitor Cyberdyne after decision-maker change
//
// Themes: competitor (Cyberdyne), pricing pushback / pricing too high, decision-maker change, lost
// Stage: lost  |  Amount: $140K  |  Status: lost

export const deal: DealSeed = {
  account: {
    id: '00000000-0000-0000-0000-aaaa00000008',
    userId: USER_ID,
    name: 'Soylent Corp',
    website: 'soylent.example',
    externalId: 'sf-acct-008',
    providerMetadata: { industry: 'health', employee_count: 320 },
  },

  opportunity: {
    id: '00000000-0000-0000-0000-bbbb00000008',
    userId: USER_ID,
    accountId: '00000000-0000-0000-0000-aaaa00000008',
    name: 'Soylent — Initial Buy (lost)',
    description:
      'Initial platform buy at Soylent Corp. Closed-lost after a decision-maker change mid-cycle handed the call to a new CTO who had competitor Cyberdyne already in production at his previous company.',
    stage: 'lost',
    amount: 14000000, // $140K in cents
    closeDate: new Date('2026-04-30T00:00:00Z'),
    nextStep: 'Schedule follow-up in 6 months (Oct 2026) for potential re-engagement once the new CTO has cycled through his Cyberdyne renewal.',
    probability: 0,
    isClosed: true,
    isWon: false,
    stateOfDealStatus: 'lost',
    stateOfDeal:
      'Lost to competitor Cyberdyne due to pricing pushback (our quote was ~30% higher) compounded by a decision-maker change mid-cycle. Our champion, the former CTO Marcus Hale, departed in early April; his replacement Priya Rangan already had Cyberdyne in production at her previous company and standardized on it before we could re-run discovery.',
    isVisible: true,
    emailDomains: ['soylent.example'],
  },

  contacts: [
    {
      id: '00000000-0000-0000-0000-cccc08000001',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000008',
      firstName: 'Marcus',
      lastName: 'Hale',
      email: 'marcus.hale@soylent.example',
    },
    {
      id: '00000000-0000-0000-0000-cccc08000002',
      userId: USER_ID,
      accountId: '00000000-0000-0000-0000-aaaa00000008',
      firstName: 'Priya',
      lastName: 'Rangan',
      email: 'priya.rangan@soylent.example',
    },
  ],

  emails: [
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      accountId: '00000000-0000-0000-0000-aaaa00000008',
      contactId: '00000000-0000-0000-0000-cccc08000001',
      occurredAt: new Date('2026-04-03T16:20:00Z'),
      subject: 'Heads-up — I am leaving Soylent',
      bodyText:
        'Wanted to give you a heads-up before this goes public next week — I am leaving Soylent at the end of the month. The board has already lined up my successor, Priya Rangan, who joins from a competitor in the same space. I think the deal is still defensible but you should know she has strong opinions about tooling. I will do what I can to warm-hand the relationship before I go, but you should plan for a decision-maker change mid-cycle.',
      fromAddress: 'marcus.hale@soylent.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-soylent-001',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      accountId: '00000000-0000-0000-0000-aaaa00000008',
      contactId: '00000000-0000-0000-0000-cccc08000001',
      occurredAt: new Date('2026-04-04T14:05:00Z'),
      subject: 'Re: Heads-up — congrats + handoff request',
      bodyText:
        'Marcus — congrats on the next chapter, well-deserved. Selfishly, I would love to ask for one favor before you head out: a warm intro to Priya with a short note on where we landed on scope and the pricing tier. Happy to do a three-way 30-minute call so she does not feel like she is inheriting a half-built sales process. If now is too crazy, even a one-paragraph internal handoff doc would mean a lot.',
      fromAddress: 'rep@findtempo.co',
      toAddresses: ['marcus.hale@soylent.example'],
      direction: 'outbound',
      threadId: 'thread-soylent-001',
      hasAttachments: false,
    },
    {
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      accountId: '00000000-0000-0000-0000-aaaa00000008',
      contactId: '00000000-0000-0000-0000-cccc08000002',
      occurredAt: new Date('2026-04-29T18:40:00Z'),
      subject: 'Going a different direction',
      bodyText:
        'Thanks for the time over the last few weeks and for the call yesterday. After reviewing the proposal with my team, we have decided to go a different direction and standardize on Cyberdyne — I ran it in production at my previous company and the team here is comfortable with that path. The pricing was also too high for where we are this fiscal year, and I could not justify the delta to my CFO given a viable alternative already vetted. I appreciate the professionalism throughout and would not rule out a future conversation, but for this cycle we are calling it lost on your side.',
      fromAddress: 'priya.rangan@soylent.example',
      toAddresses: ['rep@findtempo.co'],
      direction: 'inbound',
      threadId: 'thread-soylent-002',
      hasAttachments: false,
    },
  ],

  transcripts: [
    {
      id: '00000000-0000-0000-0000-eeee08000001',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      occurredAt: new Date('2026-05-01T17:00:00Z'),
      title: 'Soylent — Lost-deal debrief',
      source: 'zoom',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['rep@findtempo.co', 'priya.rangan@soylent.example'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Priya, appreciate you taking 30 minutes for a debrief — these calls are genuinely useful for us. Mind if I ask the blunt question first? What was the single biggest factor in why we lost?',
        },
        {
          speaker: 'buyer',
          text: 'Honestly, two things stacked. One, the competitor — Cyberdyne — I had already run them in production at my last company, so the switching cost in my head was zero. Two, pricing pushback. Your quote came in around 30% above their renewal number and I could not justify that delta to the CFO in my first quarter here.',
        },
        {
          speaker: 'seller',
          text: 'That tracks with what we were hearing from Marcus before he left. Can I ask — if the pricing had been at parity with Cyberdyne, would the decision-maker change still have been enough on its own to flip this?',
        },
        {
          speaker: 'buyer',
          text: 'Probably, yeah. I will be honest with you — when I walked in and saw a half-finished evaluation against a vendor I had never used, and a champion who was already out the door, the path of least resistance was obvious. The pricing too high piece just gave me cover to make the call quickly.',
        },
        {
          speaker: 'seller',
          text: 'Useful. One more — is there a scenario in 6 to 12 months where this re-opens? I am not trying to relitigate, just want to know whether to schedule a check-in.',
        },
        {
          speaker: 'buyer',
          text: 'Cyberdyne renews in Q1 next year. If their pricing creeps or the integration story gets worse, I would take a second look. Ping me in October — I will be past the dust-settling phase and willing to have a real conversation.',
        },
        {
          speaker: 'seller',
          text: 'Done. I will put it on the calendar for early October. Thanks for the candor, Priya — most folks ghost after a lost deal and this is genuinely more useful than a win sometimes.',
        },
      ]),
      summary:
        'Lost-deal debrief with new CTO Priya Rangan. Confirms loss driven by competitor Cyberdyne (already in production at her previous company) compounded by pricing pushback (~30% above Cyberdyne renewal) and the decision-maker change after Marcus Hale departed. Door left open for re-engagement around Cyberdyne renewal in Q1 2027 — agreed to a follow-up in October.',
      enhancedNotes:
        'Action: schedule October 2026 re-engagement check-in with Priya tied to Cyberdyne renewal cycle.',
      externalId: 'gong-call-80801',
    },
    {
      id: '00000000-0000-0000-0000-eeee08000002',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      occurredAt: new Date('2026-01-20T16:00:00Z'),
      title: 'Soylent — Initial discovery with Marcus Hale',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['rep@findtempo.co', 'marcus.hale@soylent.example'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Marcus, thanks for making the time. To kick off — what made you take this meeting? I want to make sure we are actually solving something real before we run you through any product.',
        },
        {
          speaker: 'buyer',
          text: 'Honest answer — we are spending too much engineering time on a process that should be automated, and the platform we cobbled together in-house is starting to crack as the team has grown. I read the case study you sent and the shape of the problem looked exactly like ours.',
        },
        {
          speaker: 'seller',
          text: 'Got it. Can you walk me through how the current in-house thing works today? I want to understand the seams before I show you anything.',
        },
        {
          speaker: 'buyer',
          text: 'Sure. Two engineers built it as a side project about three years ago. It runs on a Postgres box and a handful of cron jobs. It worked great until we hit about 200 employees — now we are spending probably 15 percent of one engineer to keep it alive, and onboarding new use cases takes weeks. We do not have a budget line for it, which is part of why this has stayed broken so long.',
        },
        {
          speaker: 'seller',
          text: 'That last part is useful — no budget line. If we get to the proposal stage, who is the right person to bring in on the dollars conversation? I would rather surface that now than blindside anyone in week six.',
        },
        {
          speaker: 'buyer',
          text: 'Me first, then our CFO Dana Okafor before anything gets signed. I have spend authority up to a number that I suspect is below your list price, so we will probably need her in the room at some point. But run the demo at me first — if I am not bought in, none of this matters.',
        },
        {
          speaker: 'seller',
          text: 'Perfect. I will put a demo on the calendar for the first week of February with you and whoever from your team would use this day to day. Anything I should avoid spending time on in that demo?',
        },
        {
          speaker: 'buyer',
          text: 'Skip the marketing slides. Show me the data model and the integration story — those are the two places our last attempt at a vendor fell over. If those look good I will pull in the team.',
        },
      ]),
      summary:
        'Initial discovery with former CTO Marcus Hale. Strong fit signal: in-house tooling cracking at scale, 15% of an engineer maintaining it, no existing budget line. Marcus has spend authority up to a threshold below list price; CFO Dana Okafor will need to be looped in before signature. Asked us to skip marketing in the demo and focus on data model + integrations.',
      enhancedNotes:
        'Champion: Marcus Hale. CFO to loop in later: Dana Okafor. Demo scoped to data model + integration story.',
      externalId: 'gong-call-80802',
    },
    {
      id: '00000000-0000-0000-0000-eeee08000003',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      occurredAt: new Date('2026-02-03T17:00:00Z'),
      title: 'Soylent — Product demo with Marcus + platform team',
      source: 'zoom',
      duration: 60 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'se@findtempo.co',
        'marcus.hale@soylent.example',
        'leah.tran@soylent.example',
        'omar.diaz@soylent.example',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Quick framing before we dive in — Marcus asked us to skip the marketing and go straight at data model and integrations. So that is what you are going to see. Leah, Omar — feel free to interrupt with the spiky technical questions whenever. The worst demo is the one where you nod through it and tell Marcus afterward that it would not work.',
        },
        {
          speaker: 'buyer',
          text: 'Appreciate that. I want them poking holes — that is the whole point of bringing them today.',
        },
        {
          speaker: 'seller',
          text: 'Great. Let me share the entity model first, then we will walk a real customer record through three different ingestion paths and a couple of webhook patterns.',
        },
        {
          speaker: 'buyer',
          text: 'Okay, that schema is closer to ours than I expected. The polymorphic association on the activity table — does that index well at our volume? We are doing about 40 million rows a quarter on the equivalent table today.',
        },
        {
          speaker: 'seller',
          text: 'It does. The case study customer I mentioned is at roughly 3x that volume on the same shape. I will share their architecture diagram after this call. What about you, Omar — any concerns from the integration side so far?',
        },
        {
          speaker: 'buyer',
          text: 'Honestly, this looks really good. The webhook retry semantics are nicer than what we built. If you can show me the deletion / GDPR flow next I will be a happy person.',
        },
        {
          speaker: 'seller',
          text: 'Doing that next. Marcus — gut check from you before we move on?',
        },
        {
          speaker: 'buyer',
          text: 'Gut check is positive. This is the first demo in two years where I did not have to mentally translate the product back to our problem. Let us keep going — I want to talk pricing by the end of the call so I can start the internal conversation.',
        },
      ]),
      summary:
        'Demo with Marcus + two platform engineers (Leah Tran, Omar Diaz). Strong reaction across the room — schema mapped cleanly to their model, webhook semantics rated favorably vs in-house, and Marcus closed by asking for pricing so he can start the internal conversation. Promised follow-up with reference customer architecture diagram and a GDPR deletion walk-through.',
      enhancedNotes:
        'Next step: send pricing tier options + reference architecture diagram. Demo went well — Marcus asked to move to pricing.',
      externalId: 'gong-call-80803',
    },
    {
      id: '00000000-0000-0000-0000-eeee08000004',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      occurredAt: new Date('2026-02-17T16:30:00Z'),
      title: 'Soylent — First pricing conversation with Marcus',
      source: 'gong',
      duration: 35 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['rep@findtempo.co', 'marcus.hale@soylent.example'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Marcus, I sent over the three-tier proposal yesterday. Wanted to give you space to react before I tried to sell anything. Where did your head go when you opened it?',
        },
        {
          speaker: 'buyer',
          text: 'I will be direct with you — the number on the middle tier is where the product capability lines up with what we need, but the number itself is rough. I am hearing pricing pushback from myself before I even get to the CFO. We are at $140K on that tier and I had been internally modeling something closer to $90K.',
        },
        {
          speaker: 'seller',
          text: 'Appreciate the directness. Help me understand the $90K — is that a benchmark from another vendor, a budget you carved out, or back-of-envelope from what you are spending in engineering time today?',
        },
        {
          speaker: 'buyer',
          text: 'Mostly the third one — what I can defend internally as a swap for engineering time we currently burn. There is no apples-to-apples vendor quote in front of me. But I will tell you straight that if I bring $140K to Dana cold, her first reaction is going to be that the pricing is too high relative to what we get from the homegrown thing.',
        },
        {
          speaker: 'seller',
          text: 'Got it. Two things I can do — I can take a pass at a revised tier that strips a couple of premium capabilities you flagged as nice-to-have, and I can put together the ROI math against the engineering burn so you have it for the Dana conversation. Would both of those help?',
        },
        {
          speaker: 'buyer',
          text: 'Both, yes. The ROI math is honestly the more important of the two — I can defend a higher number if the math is tight, but I cannot defend it on vibes. Give me a week, get me the revised proposal and the ROI doc, and I will schedule the next call.',
        },
        {
          speaker: 'seller',
          text: 'Done. You will have both by end of next week. One last question — is there a number where this just becomes an obvious yes for you personally, setting Dana aside?',
        },
        {
          speaker: 'buyer',
          text: 'Yes — somewhere in the $110K to $120K band with the middle-tier capability set. Below that I am writing the contract today. Above that and I have to fight for it.',
        },
      ]),
      summary:
        'First pricing conversation with Marcus. Surfaced pricing pushback — our $140K middle-tier quote is above his internal mental model of ~$90K. Anchor band where deal becomes "obvious yes" for him personally: $110K–$120K. Action: rep to send revised tier proposal + ROI math against engineering burn before next call.',
      enhancedNotes:
        'Pricing pushback surfaced. Marcus mental anchor: $110K–$120K. Action: revised proposal + ROI doc within a week.',
      externalId: 'gong-call-80804',
    },
    {
      id: '00000000-0000-0000-0000-eeee08000005',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      occurredAt: new Date('2026-03-03T17:00:00Z'),
      title: 'Soylent — Revised pricing + CFO Dana joining for the back half',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'marcus.hale@soylent.example',
        'dana.okafor@soylent.example',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Marcus, Dana — thanks for the time. Plan for this call: I walk you through the revised tier and the ROI math, you push back as hard as you want, and we end with a clear next step. Sound good?',
        },
        {
          speaker: 'buyer',
          text: 'Works for me. Dana — quick context, the original quote was $140K and I pushed back. The revised number we are about to see should be lower, with two premium modules stripped that we agreed we do not need year one.',
        },
        {
          speaker: 'seller',
          text: 'Right. Revised number is $128K, with an option to add the stripped modules later at a pre-agreed rate. ROI math says you recover the cost in roughly nine months against current engineering burn — that doc is in your inbox.',
        },
        {
          speaker: 'buyer',
          text: 'Let me jump in. I have looked at the ROI doc. The math is fine on its own terms, but $128K is still pricing too high for a tool we did not have a line item for at the start of the year. I am being asked to find that money from somewhere, and the somewhere has to come from a project that someone else cares about.',
        },
        {
          speaker: 'seller',
          text: 'That is a fair concern. Is there a payment structure that would change the calculus? For example, a 6-month deferred start or quarterly instead of annual would shift the cash impact even though the contract value stays the same.',
        },
        {
          speaker: 'buyer',
          text: 'Quarterly helps a little. Deferred start does not — by the time it kicks in we are in next fiscal and the conversation is the same. Honestly the cleanest thing for me would be a number that starts with a 1-1, not a 1-2. I know that is not your problem to solve, but I am telling you what would make this a quick yes from finance.',
        },
        {
          speaker: 'buyer',
          text: 'Dana, can I push back gently — the engineering time we burn on this is a real cost too, it is just not on your line. The ROI math captures that. I do not want us to walk away from a tool that fixes a real problem because the cost is not in the right column.',
        },
        {
          speaker: 'seller',
          text: 'Let me take this back. I am going to see what I can do on the number and structure together — no promises but I want to come back with one more option before we go back and forth on this. Can we hold a slot in two weeks?',
        },
        {
          speaker: 'buyer',
          text: 'Hold the slot. And appreciate you not pretending the pricing pushback is not real — last vendor we talked to spent 20 minutes telling us we did not understand value, which did not land well.',
        },
      ]),
      summary:
        'Multi-stakeholder pricing call with Marcus + CFO Dana Okafor. Revised tier landed at $128K (down from $140K) with two premium modules deferred. Pricing pushback continued — Dana stated the price is too high for a tool without a budget line. Marcus defended the engineering ROI but acknowledged he needs a number "starting with 1-1." Quarterly billing accepted in principle; deferred start dismissed. Rep to come back with a final structure within two weeks.',
      enhancedNotes:
        'CFO joined. Pricing too high vs budget line. Marcus still advocating internally. Action: one more pricing structure pass before mid-March.',
      externalId: 'gong-call-80805',
    },
    {
      id: '00000000-0000-0000-0000-eeee08000006',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      occurredAt: new Date('2026-03-12T22:00:00Z'),
      title: 'Soylent — Internal deal review (at-risk flag)',
      source: 'zoom',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'manager@findtempo.co',
        'se@findtempo.co',
      ],
      scope: 'internal',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'I am flagging Soylent as at-risk for the forecast call tomorrow. Wanted to talk it through with you both before I move the slider.',
        },
        {
          speaker: 'unknown',
          text: 'Walk me through it. Last I heard the demo went great and Marcus was champion-of-the-year material.',
        },
        {
          speaker: 'seller',
          text: 'Both true, still true. Two things have shifted. One — the pricing pushback is real and it is structural, not negotiation theater. The CFO sees $128K as a tool without a budget line and is anchoring on "starting with a 1-1." We have one more structuring pass we can do, but I am not optimistic we close the gap.',
        },
        {
          speaker: 'seller',
          text: 'Two — and this is the bigger thing — I am hearing through a back channel that there may be a decision-maker change coming at Soylent. Nothing public, but Marcus has been weirdly cautious on the last two emails and a recruiter I know mentioned his name. If he leaves mid-cycle we are starting over with whoever inherits this, and starting over from a position where the pricing has already been pushed back on is not a great spot.',
        },
        {
          speaker: 'unknown',
          text: 'Define "back channel." Are we forecasting on rumor?',
        },
        {
          speaker: 'seller',
          text: 'Fair. The recruiter mention is rumor. The cautious emails are real. I am not saying the deal is lost, I am saying the variance just widened a lot and I do not want to carry it at 70 percent on the forecast.',
        },
        {
          speaker: 'unknown',
          text: 'Okay — what is your ask? Move it to commit-at-risk, or pull it from commit entirely?',
        },
        {
          speaker: 'seller',
          text: 'Move it to commit-at-risk this week. If we get through the next pricing pass with Marcus still leading from the front, I will move it back. If he goes quiet for more than seven days, I am pulling it.',
        },
        {
          speaker: 'unknown',
          text: 'Approved. And worth pre-positioning the SE side — if there is a decision-maker change we are going to want to re-run a 30-minute technical fit call with the new person before we re-pitch commercials.',
        },
      ]),
      summary:
        'Internal deal review. Rep flagging Soylent as commit-at-risk on the forecast. Two reasons: (1) structural pricing pushback from CFO that one more pass is unlikely to close, and (2) early signal of a possible decision-maker change — Marcus going cautious in email + recruiter chatter. Agreed plan: move to commit-at-risk now; pull entirely if Marcus goes quiet >7 days. SE pre-positioned to re-run a technical fit call if a new CTO appears.',
      enhancedNotes:
        'Internal at-risk flag. Triggers to pull from commit: >7 days of silence from Marcus, or confirmed decision-maker change.',
      externalId: 'gong-call-80806',
    },
    {
      id: '00000000-0000-0000-0000-eeee08000007',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      occurredAt: new Date('2026-03-24T15:30:00Z'),
      title: 'Soylent — Champion 1:1 with Marcus',
      source: 'granola',
      duration: 30 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['rep@findtempo.co', 'marcus.hale@soylent.example'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Marcus, I asked for this slot off-process because I want to talk shop with you for 30 minutes, not run a sales call. How are you actually feeling about this deal — not the price, the deal as a whole.',
        },
        {
          speaker: 'buyer',
          text: 'Appreciate that framing. Honestly — I am trying to get this done. The product is the right fit, my team is bought in, the only thing in the way is the dollars and frankly some internal political weather that has nothing to do with you.',
        },
        {
          speaker: 'seller',
          text: 'What would help you most right now? I would rather build the next two weeks of conversation around what you actually need than guess.',
        },
        {
          speaker: 'buyer',
          text: 'Two things. One — give me a final number you can stand behind, so I am not negotiating against my own shadow. Two — give me a one-page memo I can hand to Dana that is structured like a finance memo, not a sales doc. She reads memos, she does not read decks.',
        },
        {
          speaker: 'seller',
          text: 'Both doable. On the final number — I have one more lever I can pull internally, and I think I can get you to $118K with quarterly billing. That is the floor on my side and I am not going to pretend there is more room below it.',
        },
        {
          speaker: 'buyer',
          text: 'That number works for me personally. It is at the top of the band I told you about, but it is in the band. Get me the memo and I will run the play with Dana.',
        },
        {
          speaker: 'seller',
          text: 'Last question and you can decline to answer. The internal political weather — should I know anything that would change how I run the next few weeks?',
        },
        {
          speaker: 'buyer',
          text: 'I cannot say much yet. What I will tell you is — do not be surprised if the org chart looks different in three weeks, and if it does, the deal is still defensible but the path gets harder. Get me the memo this week. I want to push as hard as I can while I am still the one pushing.',
        },
      ]),
      summary:
        'Off-process champion 1:1 with Marcus. He is "trying to get this done" — product fit and team buy-in are solid, only the price + internal political weather in the way. Rep committed to a final floor number of $118K (top of Marcus mental band) with quarterly billing + a one-page finance-style memo for Dana. Marcus hinted at an upcoming org-chart change without confirming details — said the deal stays defensible but the path gets harder if it lands.',
      enhancedNotes:
        'Final floor: $118K quarterly. Marcus hinted decision-maker change incoming. Action: deliver finance-style memo this week.',
      externalId: 'gong-call-80807',
    },
    {
      id: '00000000-0000-0000-0000-eeee08000008',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      occurredAt: new Date('2026-04-07T17:00:00Z'),
      title: 'Soylent — Final pricing pitch to CFO Dana (with Marcus)',
      source: 'zoom',
      duration: 40 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: [
        'rep@findtempo.co',
        'marcus.hale@soylent.example',
        'dana.okafor@soylent.example',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Dana, thanks for the time. Plan is simple — Marcus walks you through the memo, I answer commercial questions, and we land on either yes, no, or a specific blocker we can take away from this call.',
        },
        {
          speaker: 'buyer',
          text: 'Dana — the headline is $118K annual, billed quarterly, two premium modules deferred until year two with pre-agreed pricing. The memo lays out the engineering ROI as a nine-month payback against burn we are already paying for. I am recommending we sign.',
        },
        {
          speaker: 'buyer',
          text: 'I have read the memo. It is well-built, and I appreciate that someone wrote me a finance memo instead of a slide deck. My concern is not the math — the math is honest. My concern is that we are about to add a $118K annualized commitment in a quarter where we are also being asked to fund two other things I have not greenlit yet. The pricing too high framing from our last call still applies, but the framing is more about timing now than the absolute number.',
        },
        {
          speaker: 'seller',
          text: 'Helpful to separate timing from the number. If we could land the quarterly cadence on a billing start in early Q3 — so the first payment hits in July instead of May — does that change the calculus inside this quarter?',
        },
        {
          speaker: 'buyer',
          text: 'That helps materially. It also creates a different problem — between now and July I have a board meeting and I would have to disclose the commitment. I would rather not commit to a vendor before that meeting if I can avoid it.',
        },
        {
          speaker: 'buyer',
          text: 'Dana — I hear you. Let me ask the bluntest version of the question. If we wait until after the board meeting and then sign in early Q3, do we have your support to move forward? Or are we using timing as a polite way of saying no?',
        },
        {
          speaker: 'buyer',
          text: 'Marcus, I am not saying no. I am saying I want to see the next sixty days of our cash flow before I commit. If our forecast holds, I am a yes after the board. If it does not, the answer changes. That is the honest version.',
        },
        {
          speaker: 'seller',
          text: 'Understood. Then here is what I propose — we hold the $118K and the structure as agreed, do not paper it yet, and circle back the week after your board meeting. If you have any signals before then that we should be reading, please pass them on.',
        },
        {
          speaker: 'buyer',
          text: 'That works. And appreciate you not pushing for a yes today. I will tell you that we are also working through a leadership transition that is not public yet — I do not want to overshare, but it may affect how this conversation plays out after the board.',
        },
      ]),
      summary:
        'Final pricing pitch to CFO Dana with Marcus. Dana acknowledged the memo was honest and the math defensible; objection is timing in-quarter rather than the absolute number. Agreed to hold $118K + quarterly structure, defer paperwork until after the board meeting, and revisit early Q3. Dana telegraphed an unannounced leadership transition that "may affect" the deal — first explicit signal of the decision-maker change from a second source.',
      enhancedNotes:
        'Dana: not no, conditional yes after board meeting. Decision-maker change telegraphed by CFO — risk just escalated.',
      externalId: 'gong-call-80808',
    },
    {
      id: '00000000-0000-0000-0000-eeee08000009',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      occurredAt: new Date('2026-04-14T15:00:00Z'),
      title: 'Soylent — Transition call: Marcus warm-hand to new CTO Priya',
      source: 'google_meet',
      duration: 30 * 60,
      creatorName: 'Marcus Hale',
      creatorEmail: 'marcus.hale@soylent.example',
      attendeeEmails: [
        'rep@findtempo.co',
        'marcus.hale@soylent.example',
        'priya.rangan@soylent.example',
      ],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'buyer',
          text: 'Thanks both for joining on short notice. Priya, this is the rep from the platform vendor I have been working with for the last three months. Rep, this is Priya — she is taking over as CTO at the end of next week. I wanted to do a warm hand-off rather than have you find out in an email.',
        },
        {
          speaker: 'buyer',
          text: 'Appreciate the intro, Marcus. Rep, nice to meet you. I have looked at the deck and the memo in the deal room — let me front-load my position so we do not waste anyone time. I am familiar with this category. I ran Cyberdyne at my previous company for two and a half years and I have strong opinions about it.',
        },
        {
          speaker: 'seller',
          text: 'Priya, appreciate you being direct on that. Couple of questions before I react. One — is Cyberdyne already in play at Soylent in any form? Two — what would it take for you to genuinely evaluate us against Cyberdyne rather than default to what you know?',
        },
        {
          speaker: 'buyer',
          text: 'On one — no, Soylent does not have a relationship with Cyberdyne today, but I can stand up a contract there inside two weeks given my prior relationship. On two — honestly, you would have to give me a reason that is bigger than "we are different." The decision-maker change here is real and I am not going to pretend my biases do not factor in.',
        },
        {
          speaker: 'buyer',
          text: 'Priya, in fairness — the team has done the technical evaluation. They were positive. The pricing is at $118K which is below where Cyberdyne typically lands. I am not asking you to inherit my decision, but I want you to inherit the artifacts so you are starting from a real baseline.',
        },
        {
          speaker: 'seller',
          text: 'Priya — practical proposal. Give me one 45-minute call, just you and me, where I do not pitch and I just walk through what the team built up and answer questions. After that you make whatever call you make and I will respect it. Does that work?',
        },
        {
          speaker: 'buyer',
          text: 'That is fair. Book it for next week. I will commit to coming in with an open mind, but I am not going to pretend my prior relationship with Cyberdyne is not in the room.',
        },
        {
          speaker: 'seller',
          text: 'Understood and appreciated. Marcus, thanks for the warm hand-off — this is the most generous version of a transition I have been part of in a while.',
        },
      ]),
      summary:
        'Transition call. Marcus formally warm-handed the deal to incoming CTO Priya Rangan. Priya led with her prior Cyberdyne experience — two and a half years at her previous company — and was direct that her biases factor in. No active Cyberdyne contract at Soylent yet but she could stand one up "inside two weeks." Agreed to a 45-minute non-pitch re-pitch next week before any decision. Decision-maker change now confirmed and Cyberdyne explicitly named as the alternative.',
      enhancedNotes:
        'Decision-maker change confirmed. Cyberdyne named as competitor. Next: 45-min Priya 1:1 re-pitch the week of April 21.',
      externalId: 'gong-call-80809',
    },
    {
      id: '00000000-0000-0000-0000-eeee08000010',
      userId: USER_ID,
      opportunityId: '00000000-0000-0000-0000-bbbb00000008',
      occurredAt: new Date('2026-04-21T19:00:00Z'),
      title: 'Soylent — New CTO Priya re-pitch (Cyberdyne in the room)',
      source: 'zoom',
      duration: 45 * 60,
      creatorName: 'Rep',
      creatorEmail: 'rep@findtempo.co',
      attendeeEmails: ['rep@findtempo.co', 'priya.rangan@soylent.example'],
      scope: 'external',
      language: 'eng',
      transcript: transcriptBody([
        {
          speaker: 'seller',
          text: 'Priya, as promised — not a pitch. I want to walk you through three things: what the team built up, where the pricing landed, and what is left to decide. Stop me wherever. Where do you want to start?',
        },
        {
          speaker: 'buyer',
          text: 'Start with pricing. I want to take the commercial question off the table first because if the answer there does not work, the rest does not matter.',
        },
        {
          speaker: 'seller',
          text: 'Fair. We landed at $118K annual, billed quarterly, two premium modules deferred to year two with pre-agreed step-up pricing. Dana signed off conditionally pending the board meeting. Where does that sit against your Cyberdyne benchmark?',
        },
        {
          speaker: 'buyer',
          text: 'I will be honest — Cyberdyne renewed at my last company at $92K for a similar footprint. So you are roughly 28 percent above where my anchor is. That is real pricing pushback, and it is not just my personal anchor — that is what the market clearing price looks like to me. Your pricing is too high relative to what I know I can get elsewhere.',
        },
        {
          speaker: 'seller',
          text: 'Useful. Can I ask what the Cyberdyne footprint included? Sometimes the apples-to-apples is not actually apples-to-apples when we get into the modules and the support tier.',
        },
        {
          speaker: 'buyer',
          text: 'Probably 80 percent overlap with what your middle tier covers. The remaining 20 percent — I do not need year one and may not need ever. So when I look at the comparable scope, $92K against $118K, you are still meaningfully above.',
        },
        {
          speaker: 'seller',
          text: 'Honest question — if we matched at $92K, does this deal close? Or is the decision-maker change such that even at parity I am running uphill?',
        },
        {
          speaker: 'buyer',
          text: 'Honest answer — even at parity it is a coin flip, and the coin is weighted toward Cyberdyne because the switching cost in my head is zero. At a 28 percent premium it is not a coin flip — it is a decision. I am telling you this because I respect that you asked the direct question. I do not want you to find out in a slack message that this is lost.',
        },
        {
          speaker: 'seller',
          text: 'Appreciated. Let me ask the most useful possible question then — what would have to be true for us to be back in real conversation, on whatever timeline?',
        },
        {
          speaker: 'buyer',
          text: 'Cyberdyne renews at Soylent in Q1 2027. If their pricing creeps or the integration story degrades, I am genuinely open to a second look. I will not pretend otherwise. But for this cycle, the combination of decision-maker change, Cyberdyne already being a known quantity in my head, and the pricing being too high — that is the trifecta. We are going to call it lost on your side and stand up Cyberdyne for the initial buy.',
        },
        {
          speaker: 'seller',
          text: 'Understood. I will send a short note formalizing it so it is clean on both sides, and I will calendar-block early October to come back and have a real conversation ahead of their renewal. Thank you for the directness — this is the most respectful version of losing a deal I have had in a while.',
        },
      ]),
      summary:
        'New CTO Priya re-pitch. Trifecta confirmed: (1) decision-maker change — Priya defaulting to what she knows, (2) competitor Cyberdyne already standardized in her head at $92K vs our $118K — explicit pricing pushback, ~28% premium, (3) switching cost in her mental model is zero. Even at price parity she described the outcome as a coin flip weighted toward Cyberdyne. Deal called as lost on the call; door explicitly left open for Q1 2027 ahead of Cyberdyne renewal.',
      enhancedNotes:
        'Deal confirmed lost on this call. Cyberdyne anchor: $92K. Re-engagement window: October 2026 ahead of Q1 2027 Cyberdyne renewal.',
      externalId: 'gong-call-80810',
    },
  ],
};
