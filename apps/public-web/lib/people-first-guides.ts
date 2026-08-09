import type { PeopleFirstGuideContent } from "@/components/people-first-guide";

export const peopleFirstGuides = {
  onlineBibleStudy: {
    eyebrow: "Online Bible conversation",
    title: "Explore the Bible from home",
    intro:
      "Request a welcoming online Bible conversation when attending in person is not possible. Questions are welcome, and a meeting is created only after you voluntarily request one and confirm a time.",
    sections: [
      {
        heading: "What an online conversation is",
        body: "An approved leader or volunteer can help you explore a Scripture passage, ask questions, and understand the next step without requiring prior Bible knowledge.",
        points: ["Request-based", "Human-led", "Questions welcome", "No automatic enrollment"],
      },
      {
        heading: "What it is not",
        body: "It is not an automated pastoral relationship, a hidden membership process, or a public discussion of private information. The church does not create a Zoom meeting until you confirm interest and availability.",
      },
      {
        heading: "How scheduling works",
        body: "Use the public question form to select online participation and share the contact method you want an authorized volunteer to use. The volunteer offers approved time options and confirms the meeting details with you.",
      },
      {
        heading: "Safety and privacy",
        body: "Adult-to-minor private online meetings are not created through the public workflow. Teen and child participation follows guardian and safeguarding requirements.",
      },
    ],
    nextSteps: [
      { label: "Request an online conversation", href: "/ask-a-question?topic=online_participation", description: "Choose your contact method and ask about current online options." },
      { label: "Explore questions about Jesus", href: "/questions-about-jesus", description: "Begin with who Jesus is and why Christians follow him." },
      { label: "Start reading the Bible", href: "/how-to-start-reading-the-bible", description: "Use a simple, non-pressuring starting guide." },
    ],
    ctaLabel: "Request an online conversation",
    ctaHref: "/ask-a-question?topic=online_participation",
  },
  youngAdults: {
    eyebrow: "Young adults in Lowell",
    title: "Build faith and friendships in ordinary life",
    intro:
      "Young adults can explore worship, Bible conversations, meals, service, activities, and friendships that continue beyond a single Sunday gathering.",
    sections: [
      { heading: "Come with questions", body: "You do not need a polished faith story or extensive Bible background. Honest questions and thoughtful conversation are welcome." },
      { heading: "Meet through shared life", body: "Community may grow through meals, coffee, outdoor activities, service projects, Bible discussions, and member-created Fellowship invitations." },
      { heading: "Find a sustainable rhythm", body: "The goal is not constant activity. Members choose the gatherings, conversations, and service opportunities that fit their season and availability." },
      { heading: "Know the boundaries", body: "Public pages provide safe summaries. Private meetup details, member communication, and group rosters remain inside the approved Church Hub." },
    ],
    nextSteps: [
      { label: "Plan a Sunday visit", href: "/plan-a-visit", description: "See the time, location, directions, and what to expect." },
      { label: "Ask about young adults", href: "/ask-a-question?topic=other", description: "Request current, leader-approved information." },
      { label: "Explore community", href: "/how-to-find-a-church-community", description: "Learn how Sunday connects to relationships during the week." },
    ],
  },
  serveLowell: {
    eyebrow: "Faith in action",
    title: "Serve Lowell with clarity and dignity",
    intro:
      "Explore approved opportunities to meet a real community need alongside other people. Each opportunity should explain the need, partner, time, accessibility, requirements, and responsible next step.",
    sections: [
      { heading: "Begin with the need", body: "A service opportunity should start with what the community or approved partner says is needed—not with a publicity goal." },
      { heading: "Know what participation involves", body: "Current opportunities should identify the date, duration, location, age guidance, physical requirements, skills, supplies, transportation, accessibility, and leader." },
      { heading: "Serve together", body: "Families, young adults, groups, and individuals can build relationships while helping. Some opportunities may be designed for multiple ages and abilities." },
      { heading: "Share impact responsibly", body: "Stories, names, and photos require the appropriate consent. Service recipients are never treated as marketing content or evidence of spiritual status." },
    ],
    nextSteps: [
      { label: "See public events", href: "/events", description: "Review currently approved public events and service opportunities." },
      { label: "Ask about serving", href: "/ask-a-question?topic=service", description: "Request current service information from an authorized volunteer." },
      { label: "Plan a Sunday visit", href: "/plan-a-visit", description: "Meet the community and learn how service fits the church’s mission." },
    ],
    ctaLabel: "Ask about serving Lowell",
    ctaHref: "/ask-a-question?topic=service",
  },
  comeAlone: {
    eyebrow: "A first visit on your own",
    title: "Yes, you can come to church alone",
    intro:
      "You may attend without knowing a member, announcing yourself, joining a group, or sharing personal information. Use the practical guide below to make the first visit feel more predictable.",
    sections: [
      { heading: "Arrive when you are ready", body: "Coming a little early can make the entrance and seating easier, but arriving after worship begins does not disqualify you from attending." },
      { heading: "Choose where to sit", body: "Ask a welcome volunteer for help or choose a comfortable available seat. You do not need to sit with a particular person or section." },
      { heading: "Participate or observe", body: "You may sing, pray, listen, take notes, or quietly observe. You are not required to speak publicly or explain why you came." },
      { heading: "Stay afterward only if you choose", body: "Conversation may be available after worship. Leaving when the service concludes is also a completely valid choice." },
    ],
    nextSteps: [
      { label: "See what to expect", href: "/what-to-expect", description: "Review parking, entrance, service flow, children, and accessibility." },
      { label: "Tell a welcome volunteer", href: "/plan-a-visit", description: "Optionally ask someone to help you find the entrance or a seat." },
      { label: "Ask a question first", href: "/ask-a-question?topic=first_visit", description: "Choose your contact method and ask only what matters to you." },
    ],
  },
  churchService: {
    eyebrow: "Sunday worship explained",
    title: "What happens at a church service?",
    intro:
      "A typical Boston Church Lowell gathering includes worship, prayer, Scripture, teaching, and current announcements. This guide explains the purpose of each part without assuming prior church experience.",
    sections: [
      { heading: "Worship", body: "Music and spoken words help the congregation direct attention toward God. Visitors may participate or listen without being singled out." },
      { heading: "Prayer", body: "Leaders may pray for the church, community, and current needs. A public prayer in worship is different from submitting a private prayer request." },
      { heading: "Scripture and teaching", body: "A Bible passage is read or discussed, and an approved speaker explains its meaning and application. Current teaching resources may include video, audio, transcript, references, and discussion questions." },
      { heading: "Announcements and next steps", body: "Leaders share current church information, public events, groups, service, or practical updates. Responding to an invitation remains voluntary." },
    ],
    nextSteps: [
      { label: "Plan a first Sunday", href: "/plan-a-visit", description: "See the approved time, location, and practical arrival information." },
      { label: "Watch current teaching", href: "/sermons", description: "Explore current sermon and lesson resources before visiting." },
      { label: "Ask about beliefs", href: "/ask-a-question?topic=beliefs", description: "Request a respectful conversation with an authorized volunteer." },
    ],
  },
  startBible: {
    eyebrow: "A simple place to begin",
    title: "How to start reading the Bible",
    intro:
      "You do not need to understand everything at once. Begin with a manageable passage, notice what it says, ask honest questions, and choose one small response.",
    sections: [
      { heading: "Choose a clear starting place", body: "Many people begin with one of the Gospel accounts about Jesus. The church’s approved Bible journey can also place each week inside the larger story from Genesis to Revelation." },
      { heading: "Use a simple rhythm", body: "Read the passage, notice what it reveals about God and people, ask questions, pray an honest response, and consider one practical action." },
      { heading: "Keep context visible", body: "A verse belongs inside a chapter, book, and whole-Bible story. Approved teaching and licensed Bible tools should help rather than replace the text." },
      { heading: "Learn with other people", body: "A Bible conversation can create space for questions, context, prayer, and practical application without requiring prior expertise." },
    ],
    nextSteps: [
      { label: "Explore questions about Jesus", href: "/questions-about-jesus", description: "Start with Jesus’ identity, teaching, cross, and resurrection." },
      { label: "Request a Bible conversation", href: "/ask-a-question?topic=bible_study", description: "Choose an in-person or online question and preferred contact method." },
      { label: "Browse current teaching", href: "/sermons", description: "See Scripture references, summaries, and approved lesson resources." },
    ],
    ctaLabel: "Request a Bible conversation",
    ctaHref: "/ask-a-question?topic=bible_study",
  },
  findCommunity: {
    eyebrow: "Belonging beyond attendance",
    title: "How to find a church community",
    intro:
      "A healthy church connection develops through shared worship, honest conversation, repeated small interactions, meals, groups, service, and mutual care—not through pressure to join quickly.",
    sections: [
      { heading: "Start by observing", body: "Visit public worship, review the church’s beliefs and ministries, and notice whether the community’s public practices match its stated values." },
      { heading: "Choose one low-pressure connection", body: "A meal, family group, Bible conversation, prayer walk, public event, or service project can be easier than trying to meet everyone at once." },
      { heading: "Look for mutuality", body: "Healthy belonging includes listening, shared responsibility, respect for boundaries, and opportunities to contribute rather than only consume content." },
      { heading: "Take your time", body: "You control whether to return, request a conversation, explore a group, or seek member access. A public visit does not create private-app membership." },
    ],
    nextSteps: [
      { label: "Plan a Sunday visit", href: "/plan-a-visit", description: "Begin with public worship and practical first-visit information." },
      { label: "Explore family groups", href: "/family-groups", description: "See how smaller communities can meet during the week." },
      { label: "Ask about community", href: "/ask-a-question?topic=other", description: "Request current information based on your questions and availability." },
    ],
  },
  questionsJesus: {
    eyebrow: "Begin with Jesus",
    title: "Questions about Jesus are welcome",
    intro:
      "Explore who Jesus is, why Christians follow him, and how his life, teaching, cross, and resurrection shape Christian faith. You may read, watch, ask, or request a conversation without pressure.",
    sections: [
      { heading: "Who is Jesus?", body: "Christian Scripture presents Jesus as the Messiah and Son of God who reveals God’s character, announces God’s kingdom, calls people to follow, and welcomes honest seekers." },
      { heading: "What did Jesus teach?", body: "Jesus taught about love for God and neighbor, mercy, repentance, justice, prayer, humility, forgiveness, discipleship, and life in God’s kingdom." },
      { heading: "Why do the cross and resurrection matter?", body: "Christian faith centers on Jesus’ self-giving death and resurrection. Approved church teaching should explain these claims directly from Scripture and welcome thoughtful questions." },
      { heading: "What does following Jesus involve?", body: "Following Jesus includes trust, learning, repentance, love, community, service, prayer, and an ongoing life shaped by his teaching—not instant perfection." },
    ],
    nextSteps: [
      { label: "Start reading the Bible", href: "/how-to-start-reading-the-bible", description: "Use a simple rhythm for reading and asking questions." },
      { label: "Request a Bible conversation", href: "/ask-a-question?topic=beliefs", description: "Ask an authorized volunteer about Jesus or Christian belief." },
      { label: "Explore current teaching", href: "/sermons", description: "Review recent Scripture references, summaries, and teaching resources." },
    ],
    ctaLabel: "Ask a question about Jesus",
    ctaHref: "/ask-a-question?topic=beliefs",
  },
} satisfies Record<string, PeopleFirstGuideContent>;
