# Gifts of the Church, Prayer Well, and Recovery Ministry

## Purpose

These three Church Hub systems are designed to move members from passive awareness into voluntary, real-world contribution, prayer, support, and responsible community.

```text
Gifts of the Church
→ identify strengths the member chooses to share
→ connect skills and items to approved needs
→ respond privately
→ moderate risk and complete the need

Prayer Well
→ member chooses audience and anonymity
→ authorized members pray or encourage
→ owner posts updates
→ answered prayer becomes a testimony record
→ pastoral and safeguarding concerns remain restricted

Recovery Ministry
→ public information and voluntary inquiry
→ private member access request
→ approved leader review
→ private weekly ministry journey and group
→ public treatment resources and appropriate professional referral
```

## Gifts of the Church

### Assessment boundary

The platform may store a member-entered summary or link to an authorized external spiritual-gifts assessment. It must not copy a proprietary questionnaire, scoring algorithm, report text, or copyrighted descriptions without a license.

Assessment results remain private to the member unless the member explicitly:

- creates a gift offer;
- responds to a need;
- shares a summary with leaders; or
- uses an entered gift as an explainable matching preference.

The system must not create a spiritual-maturity score, rank members, infer gifts from private activity, or treat a low assessment score as a weakness or disqualification.

### Marketplace boundary

Allowed posts include:

- a member offering a practical skill;
- a member requesting practical help;
- an approved church need;
- an item available to lend, exchange, donate, or sell;
- an explainable match based on explicit gift and skill tags.

The platform does not process payments or guarantee price, quality, safety, licensing, insurance, suitability, or outcome.

Paid services, item sharing, transportation, home access, childcare language, professional claims, tools, donations, and payment-account references require moderation. Dangerous, illegal, age-restricted, exploitative, deceptive, or safeguarding-incompatible posts are prohibited.

## Prayer Well

### Visibility

The member selects one of:

- church members;
- one authorized group;
- one authorized ministry;
- authorized leaders only; or
- private to the member.

The member also controls anonymous display, prayed events, encouragement, and Scripture comments.

### Restricted routing

Pastoral and safeguarding selections never appear in the ordinary prayer feed. Ownership is stored separately from the member-visible record so an anonymous display does not expose the author identifier to ordinary members.

Prayer Well is not the emergency, mandated-reporting, or safeguarding system of record. Leaders must follow written escalation procedures outside the ordinary member feed whenever required.

Prayer content is prohibited from:

- advertising audiences;
- Search Console or SEO profiles;
- visitor conversion profiles;
- default AI processing;
- member recommendation scoring;
- Outreach OS public intelligence;
- engagement leaderboards.

## Recovery Ministry

### Program naming and curriculum

The default product name is **Recovery Ministry**. The platform may display **Celebrate Recovery** only after church leadership records confirmation that the church is authorized to use the program name and approved curriculum.

The app stores lesson metadata, original church summaries, Scripture references, and licensed-resource URLs. It does not copy licensed curriculum text without permission.

### Private access

An ordinary member cannot self-enroll. The flow is:

```text
Active member sees minimal public program information
→ accepts confidentiality expectations
→ submits a private access request
→ approved recovery leader reviews
→ approval creates private participant membership
```

Ordinary members cannot see requests, rosters, progress, posts, comments, attendance, exact room information, or another member’s participation.

### Data minimization

The weekly journey records only member-selected progress states:

- not started;
- in progress;
- completed; or
- skipped for now.

The platform does not require a diagnosis, substance, sobriety date, relapse narrative, medication, treatment history, legal history, or private journal.

### Treatment boundary

Church peer ministry does not diagnose, detoxify, prescribe, provide medical monitoring, replace licensed treatment, or promise a recovery outcome. Public and participant pages provide official treatment-resource links and clear emergency boundaries.

## Recovery Outreach

The Outreach Intelligence OS can use:

- aggregate Search Console queries;
- public page performance;
- public organization websites and public contact details;
- genuinely public forum or web questions where platform terms permit review;
- public treatment and recovery resources;
- voluntary website inquiries;
- page quality and factual-accuracy checks.

It cannot create:

- an individual addiction or vulnerability score;
- a list of private Google searchers;
- a scraped patient, treatment, sober-living, or private-group directory;
- an advertising audience based on treatment or recovery interest;
- a connection between Church Hub recovery data and public Outreach intelligence;
- undisclosed automated contact or referral payments.

Every public reply, organization contact, partnership, content claim, campaign, and program-name decision requires human approval.

## Required production owners

| Responsibility                 | Required owner                                   |
| ------------------------------ | ------------------------------------------------ |
| Gifts marketplace moderation   | Trained moderator and ministry administrator     |
| Prayer Well moderation         | Trained community moderator                      |
| Pastoral prayer queue          | Ministerial owner                                |
| Safeguarding prayer routing    | Safeguarding authority                           |
| Recovery program               | Named recovery ministry leader and backup        |
| Treatment resource review      | Recovery leader plus administrative/legal review |
| Public recovery inquiries      | Approved outreach/welcome owner                  |
| Recovery Outreach partners     | Ministry and outreach leadership                 |
| Program naming and curriculum  | Central church and ministry leadership           |
| Security and incident response | Technical/security owner                         |

## Validation state

The canonical ministry release uses migrations `0027` through `0041`. Formatting is normalized before the standard repository CI, database policy suite, browser tests, and CodeQL checks are treated as authoritative. A passing software test suite does not replace church approval of prayer routing, recovery leadership, curriculum rights, crisis escalation, or moderation policy.

## Release gates

Before real data is enabled:

1. Migrations 0027–0041 apply successfully.
2. RLS tests prove members cannot self-enroll or see another member’s recovery data.
3. Prayer anonymity and audience policies pass authorization tests.
4. Restricted prayer routing is rehearsed against the written safeguarding protocol.
5. Gift moderation and risk classification are tested.
6. Public recovery forms store only voluntary, minimized information.
7. Recovery Outreach cannot query Hub recovery, prayer, counseling, child, or private-channel data.
8. Official program naming and curriculum permissions are documented.
9. Public treatment-resource links are reviewed and assigned an update owner.
10. Incident response can disable each public form, private ministry, and connector.
11. Preview mode remains impossible in production.
12. Accessibility, mobile, browser, build, database, and security checks pass.
