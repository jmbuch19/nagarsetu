// FAQ content — mirrors FAQ.md (the source doc). Rendered as accordions on
// /faq. Plain prose (markdown emphasis dropped). Keep in sync with FAQ.md.

export const FAQ_INTRO =
  "જય હાટકેશ. If you've reached this page, you're either curious about Jay Hatkesh, unsure whether to join, or wondering how a particular thing works. Sit, have your chai, and read at leisure — we tried to answer as a fellow Nagar would, not as a company.";

export const FAQ_CLOSING =
  "સેવા · સહકાર · શિસ્ત — Service, Cooperation, Discipline. The three words on our cover, the three things this place is trying to live by. Welcome.";

export type FaqItem = { q: string; a: string };
export type FaqSection = { title: string; items: FaqItem[] };

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "Just landed here — what is this?",
    items: [
      {
        q: "What is Jay Hatkesh, really?",
        a: "It's a digital home for our Nagar samaj — wherever in the world you are. Ahmedabad, Surat, Vadodara, Mumbai, Dubai, New Jersey — same community, finally in one place. The tagline Nagarsetu says it plainly: a bridge.",
      },
      {
        q: "Who is it for?",
        a: "Anyone in the Nagar samaj — and there's no test or gate at the door. You sign up, you're in. The platform recognises a few common Nagar surnames with a small welcome badge, but that's a warm nod, not a checkpoint. Your community is yours by belonging, not by approval.",
      },
      {
        q: "What can I actually do here?",
        a: "The simple way to think about it: Connect, Find, Offer. Connect with fellow Nagars — a doctor for a second opinion, a lawyer, a mentor, a possible match through matrimony. Find what you need — a room or PG in a new city, a ride, a trusted service, even mangoes in season. Offer what you have — your skills, your guidance, a spare room, your business, a tour you organise. It's the same person doing all three at different moments; the circle works in both directions.",
      },
      {
        q: "Why this — why now?",
        a: "Because we've quietly drifted apart. The samaj is scattered across cities and continents; our parents grow older as we move farther; we Google \"good cardiologist near me\" when a fellow Nagar two cities away could give us a calm second opinion. The old phone-call closeness is fading. Jay Hatkesh exists to bring it within reach again — knowledge, hospitality, care, opportunity, and presence — among our own.",
      },
      {
        q: "Is it for-profit?",
        a: "It's bootstrapped and lean. We don't take any commission from anything between members. The only money the platform handles is a small listing fee from people who publish a commercial listing (a business, a paid service, a rental). Everything else — joining, browsing, matrimony, mentorship, the magazine — is free.",
      },
      {
        q: "Who built it?",
        a: "A fellow Nagar who felt the gap. Quietly built, slowly grown, with the community's input shaping what gets added.",
      },
    ],
  },
  {
    title: "Joining & profile",
    items: [
      {
        q: "How do I join? Is it complicated?",
        a: "One number, one OTP, done. You enter your mobile number (the one with WhatsApp), receive a six-digit code on WhatsApp, type it in. That's the whole login. No long forms at the gate.",
      },
      {
        q: "Why WhatsApp OTP and not email?",
        a: "Because we all live in WhatsApp. Email — let's be honest — most of us only opened because the phone made us. For our homemakers, our elders, our small business owners, email sits unread. WhatsApp is where we actually look. So that's where the OTP goes.",
      },
      {
        q: "What details will you ask after I sign up?",
        a: "A small amount, in a gentle flow. Required: your name, surname, city, PIN, gender, date of birth. Encouraged but skippable: a photo, your sub-community, a short line about yourself, email if you want receipts. Then a warm conversation about your profession and what you might be open to offering. You can edit or skip almost everything, anytime.",
      },
      {
        q: "Why does it ask my profession and specialty?",
        a: "So a younger Nagar with a question can find you — not your number, just that you exist and might help. A worried mother in Rajkot looking for a paediatrician can see \"yes, there are 6 Nagar paediatricians in our city\" before she ever sees a phone number. With specialty she can find you — and you choose whether to be reachable.",
      },
      {
        q: "What does \"are you open to giving expert guidance?\" mean? Am I committing to anything?",
        a: "No. It's a yes I'm open to it — a kind of \"you may approach me\" sign. Nobody can demand your time, nobody can call you at midnight. You'll see who's reached out and decide whether and when to reply. And you can switch it off anytime.",
      },
      {
        q: "What if I don't want to share my profession publicly?",
        a: "You don't have to. That whole section is optional. Sign up, leave it blank, browse around. We may gently ask again later if a fellow Nagar would benefit — and you can always say not yet.",
      },
      {
        q: "Why are you not asking my home address?",
        a: "Because you don't need one to belong to the community. City and PIN are enough. Your house number is yours, not the platform's. The only time exact address comes up is on a specific listing — a business or shop carries its address (customers must find you), but it's never attached to your personal profile.",
      },
      {
        q: "Can I change my mind about what I shared?",
        a: "Always. Every consent, every offer, every detail is editable from Settings, anytime. You can also delete your account entirely — see the Manage My Data page.",
      },
      {
        q: "Is this for young people? I'm 65.",
        a: "Especially for you. Some of the people the samaj needs most are the retired uncles and aunties — a retired principal guiding a nervous Class-12 student is gold. A doctor who's stepped back still has fifty years of knowledge. The platform deliberately recognises retired members as a resource, not as people whose work is done.",
      },
      {
        q: "My grandson lives in America. Can he join?",
        a: "Yes. Nagars anywhere — India, USA, Dubai, Singapore, UK — same community. Distance doesn't change belonging.",
      },
      {
        q: "I'm not so good with apps. Will I struggle?",
        a: "The aim is the opposite — built with our elders and homemakers in mind. The most important channel isn't even the app; it's WhatsApp, where everything important reaches you. You can use Jay Hatkesh largely through WhatsApp messages, and the app for browsing when curiosity strikes.",
      },
    ],
  },
  {
    title: "How connecting actually works",
    items: [
      {
        q: "If I see a Nagar doctor's profile, can I just call them?",
        a: "Not directly out of the blue. The platform respects everyone's time. You tap \"I want to ask\" or \"I'm interested\", write a short line about what you need, and both of you get pinged on WhatsApp. From there you take it forward yourselves. Nobody's phone number is splashed across a list.",
      },
      {
        q: "How will the seller know someone's interested?",
        a: "Two ways, both real: a notification on the platform itself, and a WhatsApp message — \"Mehul from Ahmedabad is interested in your tiffin service. Tap to talk.\" Where the actual sale happens — over WhatsApp, a call, a cup of tea — is between the two of you. We just put you in touch.",
      },
      {
        q: "Does the platform handle the payment?",
        a: "No. The platform does not touch, hold, or take a cut of any money between members. If you sell mangoes for ₹400 a box, that ₹400 goes from the buyer to your UPI — directly, no middleman. We're a connector, not a cashier. Same for room rent, ride, tiffin, anything.",
      },
      {
        q: "Why not handle the money? Wouldn't it be safer?",
        a: "Two reasons. First, the moment a platform handles other people's money it becomes a different kind of beast — legally, technically, in the trust it carries. We stayed small and lean so we can do this without taking a cut. Second, you and your fellow Nagar can do this directly — and you should. That's the community working as it always has.",
      },
      {
        q: "How do I know the person I'm talking to is a real Nagar?",
        a: "For most things — buying tiffin, asking a question — the same way you do at a samaj function: you talk to them, you see their profile, their city, their name, their reviews from other members. For higher-risk things — staying in someone's home, renting their bike — those hosts complete a light photo-ID check first, so you're not handing keys to a stranger.",
      },
      {
        q: "What if the deal goes badly between us?",
        a: "The platform stays out of disputes — we weren't part of the transaction. But you can leave an honest review (good or bad), and a pattern of bad behaviour gets a member warned, listings suspended, or in serious cases, the account closed. Reputation here matters because the community is small and the same names keep coming up.",
      },
    ],
  },
  {
    title: "Money — the listing fee",
    items: [
      {
        q: "Is joining free?",
        a: "Yes. Joining, profile, browsing, matrimony, mentorship, the magazine — all free. The platform should be open to every Nagar. Belonging shouldn't have a price.",
      },
      {
        q: "So when do I pay?",
        a: "Only when you publish a commercial offer — a business listing, a paid service, a room/PG/vehicle for rent, mangoes for sale. There's a small admin-set fee (an example: ₹199 for 30 days; it may change) that buys visibility for that period. While the community is small, the platform may keep this a token — fair value, not a toll.",
      },
      {
        q: "What does the fee buy me?",
        a: "Reach, honestly stated upfront: your listing reaches active Nagar members across India, USA, Dubai and wherever else our samaj lives, and appears in the community digest; interested members are nudged to you on WhatsApp. We promise the reach, not the sale — that depends on what you offer and how. You'll see your views and leads counted, so you know exactly what you got.",
      },
      {
        q: "Can I get a refund if no one buys?",
        a: "The fee is non-refundable once the listing is live — because the reach has already been delivered. You can pause or cancel future renewals anytime.",
      },
      {
        q: "What happens when my listing's 30 days end?",
        a: "You'll get a friendly reminder a few days before. You can renew at the then-current price, or let it expire. If the admin has raised the fee since you joined, your original listing isn't affected mid-term — the price you paid is locked for that term.",
      },
      {
        q: "Will the platform ever take a commission?",
        a: "No. That's a foundational promise, not a phase-one detail. The money between members stays between members. Always.",
      },
    ],
  },
  {
    title: "Offering — rooms, vehicles, PG, services",
    items: [
      {
        q: "Why should I offer my spare room when I could just put it on Airbnb?",
        a: "A fair question. Maybe Airbnb gives you ₹500 more a night. Here's what Jay Hatkesh gives you instead — a verified fellow Nagar in your home, not a stranger; reviews from your own community; the quiet pride of helping a samaj family. The four things that matter most: Earning (your room earns instead of sitting), Security (you know who you're dealing with), Safety (community accountability and reputation), and સેવા (you helped a Nagar). For many of us, those four beat the extra ₹500.",
      },
      {
        q: "I have an idle bike. Can I rent it out?",
        a: "Yes — to verified Nagars, for a day or a week, the price you set. The platform connects you; you settle the deal. Add a license check on your side before handing over keys (we'll prompt you with what to ask).",
      },
      {
        q: "I'm thinking of starting a tiffin service. Can I list it?",
        a: "Absolutely — that's exactly what this place is for. List your service, choose your area, set your rates, share your menu. The community will see it; interested members reach out; you take it from there. The fee is small, the reach is real.",
      },
      {
        q: "What's the difference between a \"Business\" listing and a \"Service\"?",
        a: "Mostly intent. A Business is a proper shop, clinic, firm — something with a fixed presence. A Service is what you personally offer — tiffin, tutoring, photography, tour guiding. Both are welcome and follow the same process. Pick whichever feels right.",
      },
      {
        q: "What about senior citizens' tours, pilgrimages, things like that?",
        a: "There's a category for it. Build the plan — dates, itinerary, seats, price — list it. Other Nagars sign up. A tour for samaj elders, run by a samaj member, with other samaj members on it — that's a beautiful trip.",
      },
    ],
  },
  {
    title: "PG and rooms — both sides",
    items: [
      {
        q: "My son is moving to Mumbai for his internship. He needs a PG.",
        a: "Post a \"PG Seeker\" request — his name, the area he prefers, budget, gender, food preferences, when he needs to move in. Providers in Mumbai will see it and reach out. Posting a request is free — the platform wants seekers to feel welcome.",
      },
      {
        q: "I have a spare room in my house. Can I host PG paying guests?",
        a: "Yes — list it as a PG offer with the area, rent, sharing type, meals, deposit, rules. Because this is hosting (the higher-risk category), you'll go through a one-time photo-ID verification first. That protects your guests and your community.",
      },
    ],
  },
  {
    title: "The magazine — સેતુ સર્જન",
    items: [
      {
        q: "What's this magazine I've been hearing about?",
        a: "Setusarjan — our community e-magazine. It's been running for 87+ issues, hand-typeset by a few generous volunteers, full of members' poems, stories, reflections. Jay Hatkesh is bringing it into the app — same look, same soul, but easier to contribute to and easier to share.",
      },
      {
        q: "I write poems in Gujarati. Can I publish?",
        a: "Please do — this is exactly your place. Each month you submit your piece (deadline the 15th), it joins others, and on a chosen date the issue goes out as a beautiful PDF to the whole community.",
      },
      {
        q: "I don't know Gujarati typing on the phone.",
        a: "That's fine — the app helps you. You can type in English transliteration and have Gujarati cleanly set for you, or even speak it and have it transcribed. The warmth of the magazine remains; the typing burden is lifted.",
      },
      {
        q: "What if someone passes away — does their work disappear?",
        a: "No. A member's published contributions stay in the magazine, attributed, with an \"in memory\" note if the family wishes. Their account may quietly close, but their words remain — that's what an anthology is for.",
      },
    ],
  },
  {
    title: "Verified Help Drives — when a Nagar is in genuine need",
    items: [
      {
        q: "What is a \"Verified Help Drive\"?",
        a: "When a Nagar family is in genuine need — an ailing child needing surgery, a student needing fees — they can raise a help drive. The admin verifies the documents, then the community is told. Donors give directly to the family's account — the platform never touches the money. It's the samaj coming together, just with better reach.",
      },
      {
        q: "How do I know it's not a fraud?",
        a: "Because admin checks the supporting documents before the drive goes live, and you can see those documents yourself before deciding to give (tap \"I want to help\"). The verification is honest — admin checks that the documents look legitimate; we don't claim to predict outcomes. You don't give blind, and you give directly to the family — no middleman to scam either of you.",
      },
      {
        q: "The family's bank details — are they visible to everyone?",
        a: "No. This is deliberate. A family in distress shouldn't have their bank account broadcast where someone could clone the drive and swap in their own account. The family shares their UPI/bank only with the admin; when you tap \"I want to help\", the admin shares those details with you privately. The family gets help; their financial identity stays protected.",
      },
      {
        q: "Can I see the medical bills or documents?",
        a: "Yes, but only when you've shown intent to help — by tapping \"I want to help\". This isn't bureaucracy; it's dignity. A sick child's reports shouldn't be casually browsed by hundreds; they should be seen by people genuinely considering giving.",
      },
      {
        q: "What if I'm an NRI and want to donate?",
        a: "You can — donations come straight from you to the family. Note that cross-border donations may have additional considerations under Indian law, so please check what applies to your situation. The platform doesn't process or pool any donations.",
      },
    ],
  },
  {
    title: "The digest, WhatsApp, notifications",
    items: [
      {
        q: "Will Jay Hatkesh spam my WhatsApp?",
        a: "No — and we say that with care, because we know what WhatsApp spam feels like. The platform sends you a WhatsApp only when something is actually about you: someone showed interest in your listing, someone replied, your listing is about to expire. Once every 15 days you may also get a single short community digest — one message per cycle, never split.",
      },
      {
        q: "Can I turn off the digest?",
        a: "Yes. You consented at signup; you can withdraw that consent in Settings, anytime. No phone calls, no resistance, no \"are you sure\" five times.",
      },
      {
        q: "What about email?",
        a: "Email is mostly receipts and login fallback. We don't trust it for important things, because most of you don't check it. WhatsApp and the app are the real channels.",
      },
    ],
  },
  {
    title: "Privacy and your data",
    items: [
      {
        q: "Who can see my details?",
        a: "Your name, surname, city, profession are part of the directory — that's the whole point, finding fellow Nagars. Your phone number, email, and exact contact details are permission-gated — shown only when you choose to make a connection. Aggregate counts (\"26 Nagar doctors in Rajkot\") are public to members; individual contacts are not.",
      },
      {
        q: "Is my data sold to anyone?",
        a: "No. Not now, not ever. There are no advertisers, no third-party data buyers. Your data exists to serve you and the community, nothing else.",
      },
      {
        q: "What about Indian data protection law?",
        a: "Jay Hatkesh follows the Digital Personal Data Protection Act (DPDP), 2023. You can see what's held about you, correct it, delete it, export it, or nominate someone to handle your data — all from the Manage My Data page. Your privacy notice is available in Gujarati as well as English.",
      },
      {
        q: "And children's data?",
        a: "Treated with extra care, by law and by conscience. Members under 18 are flagged so they're never targeted with marketing or behavioural tracking. For a help drive involving a child, the parent or guardian gives consent, not the child.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes, anytime, from the Manage My Data page. Some records may be retained briefly where the law requires (e.g. payment records), but your profile and personal data are removed.",
      },
    ],
  },
  {
    title: "When a member passes",
    items: [
      {
        q: "What happens if a member passes away?",
        a: "With dignity. The family tells the admin, who verifies gently. The profile moves to a memorialised state — listings stop, contact details hide, no more lead pings, no automated reminders to the family. The community may leave condolences if the family wishes, or the profile is quietly closed — the family chooses.",
      },
      {
        q: "What about a nomination?",
        a: "You can nominate a family member or trusted friend in your account settings. If something happens, they decide what to do with your profile and data — keep it as a tribute, export it, or delete it. We hope you never need it; the option exists because life happens.",
      },
      {
        q: "Will my poems and writings be lost?",
        a: "No. Your published Setusarjan contributions stay in the magazine, attributed to you, with an \"in memory\" note if the family wishes. The account freezes; your creative legacy continues.",
      },
    ],
  },
  {
    title: "Events, announcements & scholarships",
    items: [
      {
        q: "How do I announce a community event?",
        a: "Significant events — an annual gathering, a major medical camp, a samaj function — any member can announce, and it reaches the community without waiting for admin approval. There's a check (event type, a significance confirmation, a sensible per-member limit) to keep it serious, but no gatekeeping. Trivial or spammy posts get flagged and removed reactively.",
      },
      {
        q: "What about scholarships?",
        a: "Scholarship announcements are welcome — and free to post. Whether you're an individual supporting a Nagar student or a trust running an annual scheme, list it with the criteria, deadline, and contact, and eligible families will see it.",
      },
    ],
  },
  {
    title: "The platform itself — promises and limits",
    items: [
      {
        q: "What does Jay Hatkesh promise?",
        a: "Connection, reach, visibility, a place to belong. We promise the introduction, never the outcome. A second opinion you find here isn't guaranteed right; a stay isn't guaranteed comfortable; a deal isn't guaranteed to go through. But the possibility of all those things — through someone trusted from your own community — is real, and that's the value.",
      },
      {
        q: "What does Jay Hatkesh not do?",
        a: "We don't handle money between members. We don't take commissions. We don't sell your data. We don't guarantee outcomes. We don't act as a court when two members disagree. We're a connector — and we hold that line firmly, because the moment a platform becomes more than that, it stops being a community space.",
      },
      {
        q: "Is this affiliated with any samaj organisation or trust?",
        a: "It's an independent community initiative, by a Nagar, for the samaj. It tries to serve every Nagar regardless of region or organisation.",
      },
      {
        q: "What about the future — what's coming?",
        a: "The plan grows with the community. Matrimony, mentorship matching, audio editions of the magazine, deeper search across the archive, and whatever members tell us is missing. If something you need isn't here yet, say so — that's how the next feature gets built.",
      },
    ],
  },
  {
    title: "Still curious?",
    items: [
      {
        q: "I have a question that isn't here.",
        a: "Please write to us using the Contact link. A real Nagar reads every message, and we try to reply within a working day.",
      },
      {
        q: "I have an idea for a feature.",
        a: "Even better. Many of the things this FAQ describes started as one member's question or one elder's quiet suggestion. The samaj has always grown that way — by people noticing what was missing and saying so.",
      },
    ],
  },
];
