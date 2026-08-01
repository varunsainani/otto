"""Seed rich demo data. Run once against a fresh DB:

    python -m app.seed            # create schema + seed if empty
    python -m app.seed --reset    # wipe workspace/agent data and reseed

The demo account (demo@otto.app / demo1234) owns a believable B2B sales workspace
so agent runs have real records to reason over. An admin account (admin@otto.app)
is created for the admin views.
"""
import argparse
from datetime import timedelta

from sqlmodel import Session, delete, select

from .config import settings
from .db import engine, init_db
from .models import (
    AgentRun,
    AgentStep,
    Contact,
    Deal,
    Document,
    Email,
    Note,
    Task,
    User,
    WebPage,
)
from .security import hash_password
from .util import now_utc

TODAY = now_utc().date()


def _d(days: int):
    """A date offset by days from today (negative = past)."""
    return TODAY + timedelta(days=days)


def _dt(days: int):
    return now_utc() - timedelta(days=days)


CONTACTS = [
    # name, company, title, status, segment, last_activity_days_ago, email
    ("Priya Raman", "Northwind Logistics", "VP Operations", "active", "enterprise", 3, "priya@northwind.example"),
    ("Marcus Webb", "Cedar & Co", "Founder", "active", "startup", 6, "marcus@cedar.example"),
    ("Elena Duarte", "Vela Foods", "Head of Procurement", "lead", "smb", 41, "elena@velafoods.example"),
    ("Tom Fisher", "Brightline Media", "COO", "active", "enterprise", 12, "tom@brightline.example"),
    ("Sara Nolan", "Kettle & Grain", "Owner", "lead", "smb", 58, "sara@kettlegrain.example"),
    ("David Kim", "Orbit Robotics", "CTO", "active", "startup", 2, "david@orbit.example"),
    ("Amara Okafor", "Sterling Retail Group", "Director of IT", "active", "enterprise", 19, "amara@sterling.example"),
    ("Liam Byrne", "Foundry Labs", "Product Lead", "lead", "startup", 34, "liam@foundry.example"),
    ("Nina Patel", "Harbor Health", "Operations Manager", "active", "enterprise", 8, "nina@harborhealth.example"),
    ("Carlos Mendes", "Rio Verde Cafe", "Owner", "churned", "smb", 96, "carlos@rioverde.example"),
    ("Grace Sullivan", "Pinnacle Advisory", "Partner", "lead", "smb", 45, "grace@pinnacle.example"),
    ("Omar Haddad", "Vertex Manufacturing", "Plant Director", "active", "enterprise", 27, "omar@vertexmfg.example"),
]

# title, company_idx, amount_cents, stage, close_date_days
DEALS = [
    ("Northwind annual platform + onboarding", 0, 4_800_000, "proposal", -4),
    ("Cedar & Co growth plan", 1, 960_000, "qualified", 9),
    ("Vela Foods pilot", 2, 340_000, "prospect", 21),
    ("Brightline enterprise rollout", 3, 6_250_000, "proposal", -9),
    ("Kettle & Grain starter", 4, 180_000, "prospect", 30),
    ("Orbit Robotics team seats", 5, 1_450_000, "qualified", 14),
    ("Sterling multi-region deployment", 6, 8_900_000, "proposal", -2),
    ("Foundry Labs trial expansion", 7, 520_000, "prospect", 25),
    ("Harbor Health compliance package", 8, 3_100_000, "qualified", 7),
    ("Vertex Manufacturing renewal", 11, 2_400_000, "won", -20),
    ("Rio Verde Cafe basic", 9, 120_000, "lost", -60),
]

# title, category, content
DOCUMENTS = [
    ("Refund and cancellation policy", "policy",
     "Customers may request a full refund within 30 days of purchase. After 30 days, "
     "refunds are prorated for the remaining term. Annual enterprise contracts include a "
     "90-day satisfaction guarantee. Cancellations take effect at the end of the current "
     "billing period. Refunds are processed to the original payment method within 10 business days."),
    ("Enterprise onboarding playbook", "playbook",
     "Enterprise onboarding runs over four weeks. Week 1: kickoff and access provisioning. "
     "Week 2: data import and integration setup. Week 3: admin training and workflow "
     "configuration. Week 4: go-live and success review. Each enterprise account gets a "
     "dedicated onboarding manager and a shared launch checklist."),
    ("Pricing and discount guidelines", "pricing",
     "Standard plans are billed per seat per month. Annual prepay receives a 15 percent "
     "discount. Volume discounts start at 25 seats. Enterprise deals above 50,000 dollars "
     "may include custom terms approved by a sales director. Never discount below 20 percent "
     "without director approval."),
    ("Security and data handling overview", "security",
     "Data is encrypted in transit and at rest. The platform is SOC 2 Type II certified and "
     "supports SSO via SAML. Customer data is isolated per workspace. Access to production "
     "data is restricted and audited. A data processing agreement is available for enterprise "
     "customers on request."),
    ("Product FAQ", "product",
     "The platform integrates with common CRMs and supports CSV import and export. Automations "
     "run on a shared queue with per-account limits. Reporting includes pipeline, activity, and "
     "forecast views. Mobile access is available through the responsive web app. API access is "
     "included on growth and enterprise plans."),
    ("Follow-up email best practices", "playbook",
     "Keep follow-up emails under 120 words. Reference the prospect's stated goal, propose one "
     "concrete next step, and include a specific date. For overdue deals, lead with a short "
     "recap of value and offer to answer open questions. Always personalize the opening line."),
]

# url, title, topic, content
WEB_PAGES = [
    ("https://example.com/b2b-sales-benchmarks-2026", "B2B SaaS Sales Benchmarks 2026", "sales benchmarks pipeline",
     "Median B2B SaaS win rates sit near 20 percent, with enterprise deals taking 90 to 120 days to close. "
     "Deals that stall past their expected close date convert at roughly half the baseline rate, making timely "
     "follow-up the single highest-leverage activity for pipeline health."),
    ("https://example.com/reengaging-cold-leads", "Re-engaging Cold Leads That Went Quiet", "cold leads reengagement outreach",
     "Leads with no activity in 30 or more days respond best to a short, value-first message that references their "
     "original goal. A single specific question outperforms a generic check-in. Reference a relevant result or "
     "resource to restart the conversation."),
    ("https://example.com/enterprise-procurement-cycles", "Understanding Enterprise Procurement Cycles", "enterprise procurement",
     "Enterprise procurement typically involves security review, legal, and finance sign-off. Building a mutual "
     "action plan with named owners and dates shortens cycles. Provide a security overview and data processing "
     "agreement early to avoid late-stage delays."),
    ("https://example.com/discounting-without-eroding-value", "Discounting Without Eroding Value", "pricing discount negotiation",
     "Anchor on value before price. When a discount is necessary, trade it for a concession such as a longer term "
     "or a case study. Avoid discounts beyond 20 percent without clear justification, as deep discounts train "
     "buyers to expect them at renewal."),
    ("https://example.com/sales-follow-up-cadence", "An Effective Sales Follow-up Cadence", "follow-up cadence sequence",
     "A practical cadence is day 1, day 3, day 7, then weekly. Vary the channel and the angle each touch. Stop "
     "and mark a lead dormant after five unanswered touches to keep the pipeline clean and forecasts honest."),
    ("https://example.com/forecasting-basics", "Pipeline Forecasting Basics", "forecast pipeline weighting",
     "Weight each open deal by stage probability to build a forecast. Proposal-stage deals are commonly weighted "
     "50 to 70 percent. Review overdue close dates weekly and either re-date them with a reason or move them out "
     "of the committed forecast."),
    ("https://example.com/onboarding-that-reduces-churn", "Onboarding That Reduces Churn", "onboarding retention churn",
     "Time to first value is the strongest early churn predictor. A structured four-week onboarding with a named "
     "owner and a shared checklist raises activation. Schedule a success review before the first renewal to surface "
     "risks early."),
    ("https://example.com/writing-outreach-that-gets-replies", "Writing Outreach That Gets Replies", "email outreach copywriting",
     "Short, specific, and personalized wins. Keep the subject under six words, open with a line that could only "
     "be written for this person, and close with one clear call to action tied to a date. Avoid attachments in a "
     "first touch."),
]


def _seed_workspace(session: Session, owner_id: int) -> None:
    contacts: list[Contact] = []
    for name, company, title, statusv, segment, last_days, email in CONTACTS:
        c = Contact(
            owner_id=owner_id,
            name=name,
            company=company,
            title=title,
            status=statusv,
            segment=segment,
            email=email,
            last_activity_at=_dt(last_days),
        )
        session.add(c)
        contacts.append(c)
    session.commit()
    for c in contacts:
        session.refresh(c)

    for title, cidx, amount, stage, close_days in DEALS:
        session.add(
            Deal(
                owner_id=owner_id,
                contact_id=contacts[cidx].id,
                title=title,
                amount_cents=amount,
                stage=stage,
                close_date=_d(close_days),
            )
        )

    for title, category, content in DOCUMENTS:
        session.add(Document(owner_id=owner_id, title=title, category=category, content=content))

    session.add(
        Task(owner_id=owner_id, title="Prepare Q3 pipeline review deck", due_date=_d(2),
             status="open", created_by="user")
    )
    session.add(
        Task(owner_id=owner_id, title="Send Sterling security overview", due_date=_d(-1),
             status="open", created_by="user")
    )
    session.add(
        Task(owner_id=owner_id, title="Confirm Vertex renewal paperwork", due_date=_d(-5),
             status="done", created_by="user")
    )

    session.add(
        Note(owner_id=owner_id, contact_id=contacts[0].id,
             body="Priya wants onboarding wrapped before their peak season in Q4.",
             created_by="user")
    )
    session.add(
        Email(owner_id=owner_id, contact_id=contacts[3].id, to_email=contacts[3].email,
              subject="Brightline rollout: next steps",
              body="Hi Tom, following up on the enterprise rollout proposal. Could we lock a "
                   "go-live date this month? Happy to walk your team through the security overview.",
              status="draft", created_by="user")
    )
    session.commit()


def _seed_web(session: Session) -> None:
    if session.exec(select(WebPage)).first():
        return
    for url, title, topic, content in WEB_PAGES:
        session.add(WebPage(url=url, title=title, topic=topic, content=content))
    session.commit()


def _reset_owner(session: Session, owner_id: int) -> None:
    run_ids = [r.id for r in session.exec(select(AgentRun).where(AgentRun.owner_id == owner_id)).all()]
    if run_ids:
        session.exec(delete(AgentStep).where(AgentStep.run_id.in_(run_ids)))
    session.exec(delete(AgentRun).where(AgentRun.owner_id == owner_id))
    for model in (Email, Note, Task, Deal, Document, Contact):
        session.exec(delete(model).where(model.owner_id == owner_id))
    session.commit()


def seed(reset: bool = False) -> None:
    init_db()
    with Session(engine) as session:
        demo = session.exec(select(User).where(User.email == settings.demo_email)).first()
        if not demo:
            demo = User(
                name="Demo User",
                email=settings.demo_email,
                password_hash=hash_password(settings.demo_password),
                role="member",
                locale="en",
                theme="dark",
            )
            session.add(demo)
            session.commit()
            session.refresh(demo)

        admin = session.exec(select(User).where(User.email == "admin@otto.app")).first()
        if not admin:
            admin = User(
                name="Admin",
                email="admin@otto.app",
                password_hash=hash_password(settings.demo_password),
                role="admin",
                locale="en",
                theme="dark",
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)

        _seed_web(session)

        has_data = session.exec(select(Contact).where(Contact.owner_id == demo.id)).first()
        if reset:
            _reset_owner(session, demo.id)
            has_data = None
        if not has_data:
            _seed_workspace(session, demo.id)

        contacts = session.exec(select(Contact).where(Contact.owner_id == demo.id)).all()
        deals = session.exec(select(Deal).where(Deal.owner_id == demo.id)).all()
        print(
            f"Seeded. demo={demo.email} contacts={len(contacts)} deals={len(deals)} "
            f"admin={admin.email}"
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="wipe and reseed the demo workspace")
    args = parser.parse_args()
    seed(reset=args.reset)
