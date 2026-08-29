import { GiftsShowcase } from "@/components/gifts-showcase";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";
import { loadGiftsWorkspace } from "@/lib/ministry-spaces";
import {
  addGiftAction,
  createGiftOpportunityAction,
  respondToGiftOpportunityAction,
  saveGiftProfileAction,
  updateGiftOpportunityStatusAction,
} from "./actions";

const giftCategories = [
  "hospitality",
  "teaching",
  "encouragement",
  "mercy",
  "service",
  "leadership",
  "administration",
  "music",
  "creative",
  "technology",
  "trades",
  "caregiving",
  "language",
  "transportation",
  "professional",
  "other",
];

export default async function GiftsPage() {
  const viewer = await requireViewer();
  if (viewer.demo) return <GiftsShowcase />;
  const workspace = await loadGiftsWorkspace(viewer);

  return (
    <>
      <PageHeading
        eyebrow="Skills, service, needs, and practical generosity"
        title="Gifts of the Church"
        description="Help members name how they can contribute, discover church needs, offer practical help, and respond to one another without turning spiritual gifts into a score or popularity contest."
      />

      {!workspace.configured ? (
        <section className="real-data-state real-data-state--warning">
          <h2>Gifts data is not connected.</h2>
          <p>
            Apply migration 0027 and configure Supabase authentication before collecting member
            gifts, listings, or responses.
          </p>
        </section>
      ) : (
        <div className="space-stack">
          <div className="space-two-column">
            <section className="space-form-card">
              <p className="hub-kicker">My contribution profile</p>
              <h2>Name the ways you may be able to help</h2>
              <form className="space-form" action={saveGiftProfileAction}>
                <label className="space-form__wide">
                  Headline
                  <input
                    name="headline"
                    maxLength={160}
                    defaultValue={workspace.profile?.headline ?? ""}
                    placeholder="I enjoy welcoming people and helping with practical projects."
                  />
                </label>
                <label className="space-form__wide">
                  Service summary
                  <textarea
                    name="serviceSummary"
                    rows={5}
                    maxLength={1200}
                    defaultValue={workspace.profile?.serviceSummary ?? ""}
                  />
                </label>
                <label className="space-form__wide">
                  Availability
                  <input
                    name="availabilityNotes"
                    maxLength={500}
                    defaultValue={workspace.profile?.availabilityNotes ?? ""}
                  />
                </label>
                <label>
                  Who may see this?
                  <select
                    name="sharingScope"
                    defaultValue={workspace.profile?.sharingScope ?? "church"}
                  >
                    <option value="private">Only me</option>
                    <option value="leaders">Approved leaders</option>
                    <option value="church">Church members</option>
                  </select>
                </label>
                <button className="hub-button hub-button--primary" type="submit">
                  Save gift profile
                </button>
              </form>
            </section>

            <section className="space-form-card">
              <p className="hub-kicker">Add a gift or skill</p>
              <h2>{workspace.gifts.length} gifts currently listed</h2>
              {workspace.gifts.length ? (
                <div className="gift-skill-list">
                  {workspace.gifts.map((gift) => (
                    <article key={gift.id}>
                      <div>
                        <strong>{gift.name}</strong>
                        <span>
                          {gift.category} · {gift.level}
                        </span>
                      </div>
                      <div className="gift-flags">
                        {gift.willingToServe ? <span>Ready to serve</span> : null}
                        {gift.willingToMentor ? <span>Can mentor</span> : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p>No gifts have been added to your profile yet.</p>
              )}
              <form className="space-form space-form--compact" action={addGiftAction}>
                <label className="space-form__wide">
                  Gift or practical skill
                  <input name="giftName" maxLength={120} required />
                </label>
                <label>
                  Category
                  <select name="category">
                    {giftCategories.map((category) => (
                      <option value={category} key={category}>
                        {category.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Experience
                  <select name="experienceLevel" defaultValue="comfortable">
                    <option value="learning">Learning</option>
                    <option value="comfortable">Comfortable</option>
                    <option value="experienced">Experienced</option>
                    <option value="expert">Expert</option>
                  </select>
                </label>
                <label className="space-check">
                  <input name="willingToServe" type="checkbox" defaultChecked /> Open to serving
                </label>
                <label className="space-check">
                  <input name="willingToMentor" type="checkbox" /> Open to mentoring
                </label>
                <label className="space-form__wide">
                  Notes
                  <textarea name="notes" rows={3} maxLength={700} />
                </label>
                <button className="hub-button hub-button--secondary" type="submit">
                  Add gift
                </button>
              </form>
            </section>
          </div>

          <section className="space-form-card">
            <p className="hub-kicker">Post to the church board</p>
            <h2>Offer a gift, request help, or post a church need</h2>
            <form className="space-form" action={createGiftOpportunityAction}>
              <label>
                Post type
                <select name="opportunityType" defaultValue="service_offer">
                  <option value="church_need">Church need</option>
                  <option value="member_need">Member need</option>
                  <option value="service_offer">Skill offered</option>
                  <option value="item_for_sale">Item for sale</option>
                  <option value="item_free">Free item</option>
                  <option value="barter">Exchange / barter</option>
                </select>
              </label>
              <label>
                Category
                <input name="category" maxLength={100} required />
              </label>
              <label className="space-form__wide">
                Title
                <input name="title" maxLength={180} required />
              </label>
              <label className="space-form__wide">
                Description
                <textarea name="description" rows={5} maxLength={4000} required />
              </label>
              <label>
                Arrangement
                <select name="compensationType" defaultValue="volunteer">
                  <option value="volunteer">Volunteer</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid introduction</option>
                  <option value="barter">Exchange / barter</option>
                </select>
              </label>
              <label>
                Price, when paid
                <input name="price" type="number" min={0} step="0.01" />
              </label>
              <label>
                General location
                <input name="generalLocation" maxLength={180} />
              </label>
              <label>
                Timing
                <input name="scheduleSummary" maxLength={300} />
              </label>
              <div className="space-form__wide space-form__actions">
                <button className="hub-button hub-button--primary" type="submit">
                  Publish post
                </button>
                <small>
                  Paid posts enter moderation. The church does not process payment or guarantee
                  private transactions.
                </small>
              </div>
            </form>
          </section>

          <section className="opportunity-grid">
            {workspace.opportunities.map((item) => (
              <article className="opportunity-card" key={item.id}>
                <header>
                  <span className={`space-badge space-badge--${item.type}`}>
                    {item.type.replaceAll("_", " ")}
                  </span>
                  <span className={`space-status space-status--${item.status}`}>{item.status}</span>
                </header>
                <p className="opportunity-card__author">{item.category}</p>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <dl>
                  {item.generalLocation ? (
                    <div>
                      <dt>Where</dt>
                      <dd>{item.generalLocation}</dd>
                    </div>
                  ) : null}
                  {item.scheduleSummary ? (
                    <div>
                      <dt>When</dt>
                      <dd>{item.scheduleSummary}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Arrangement</dt>
                    <dd>
                      {item.compensationType}
                      {item.priceCents !== null
                        ? ` · $${(item.priceCents / 100).toFixed(2)}`
                        : ""}
                    </dd>
                  </div>
                </dl>
                {item.responses.length ? (
                  <div className="space-thread">
                    {item.responses.map((response) => (
                      <div key={response.id}>
                        <strong>{response.responseType.replaceAll("_", " ")}</strong>
                        <span>{response.message}</span>
                        <small>{new Date(response.createdAt).toLocaleString()}</small>
                      </div>
                    ))}
                  </div>
                ) : null}
                <form className="inline-reply" action={respondToGiftOpportunityAction}>
                  <input type="hidden" name="opportunityId" value={item.id} />
                  <label>
                    Response
                    <select name="responseType" defaultValue="reply">
                      <option value="offer_help">Offer help</option>
                      <option value="request_item">Request item</option>
                      <option value="question">Ask a question</option>
                      <option value="reply">Reply</option>
                    </select>
                  </label>
                  <textarea name="message" rows={3} maxLength={2000} required />
                  <label className="space-check">
                    <input name="privateToCreator" type="checkbox" /> Private to post creator
                  </label>
                  <button className="hub-button hub-button--primary" type="submit">
                    Send response
                  </button>
                </form>
                {item.mine ? (
                  <form action={updateGiftOpportunityStatusAction} className="opportunity-status-form">
                    <input type="hidden" name="opportunityId" value={item.id} />
                    <select name="status" defaultValue={item.status}>
                      <option value="open">Open</option>
                      <option value="matched">Matched</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="closed">Closed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button className="hub-button hub-button--secondary" type="submit">
                      Update status
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </section>
        </div>
      )}
    </>
  );
}
