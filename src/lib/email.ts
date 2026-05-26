import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "ONP Notifications <support@ournextproject.us>";
const BASE = "https://www.ournextproject.us";

function loginLink(destination: string) {
  return `${BASE}/login?next=${encodeURIComponent(destination)}`;
}

export async function sendRfiSubmittedEmail({
  clientEmail,
  clientName,
  projectTitle,
  question,
  projectId,
}: {
  clientEmail: string;
  clientName: string;
  projectTitle: string;
  question: string;
  projectId: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `New Question on "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">⚠ New Question Submitted</h2>
          <p style="color: #B0C4DE;">Hello ${clientName},</p>
          <p style="color: #B0C4DE;">A contractor has submitted a question on your project <strong style="color: #fff;">"${projectTitle}"</strong>:</p>
          <div style="background: #0A1628; border-left: 3px solid #C8102E; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="color: #F0F4FF; margin: 0; font-style: italic;">"${question}"</p>
          </div>
          <p style="color: #B0C4DE;">Please log in to respond as soon as possible. Unanswered questions may delay contractor bids.</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/client/projects/${projectId}/rfis`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Question
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendRfiAnsweredEmail({
  contractorEmail,
  projectTitle,
  question,
  response,
  projectId,
}: {
  contractorEmail: string;
  projectTitle: string;
  question: string;
  response: string;
  projectId: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: contractorEmail,
    subject: `Your Question on "${projectTitle}" Has Been Answered`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #4ADE80; margin-top: 0;">✅ Question Answered</h2>
          <p style="color: #B0C4DE;">Your question on <strong style="color: #fff;">"${projectTitle}"</strong> has been answered:</p>
          <div style="background: #0A1628; border-left: 3px solid #7A9CC4; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="color: #7A9CC4; margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Question</p>
            <p style="color: #F0F4FF; margin: 0; font-style: italic;">"${question}"</p>
          </div>
          <div style="background: #0A1628; border-left: 3px solid #4ADE80; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="color: #4ADE80; margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Answer</p>
            <p style="color: #F0F4FF; margin: 0;">"${response}"</p>
          </div>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/contractor/projects/${projectId}/rfis`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Project
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendBidAwardedEmail({
  contractorEmail,
  contractorName,
  projectTitle,
  projectId,
}: {
  contractorEmail: string;
  contractorName: string;
  projectTitle: string;
  projectId: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: contractorEmail,
    subject: `Congratulations! You Won "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #2D1B69; border: 1px solid #5B21B6; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #A78BFA; margin-top: 0;">★ Bid Awarded!</h2>
          <p style="color: #B0C4DE;">Congratulations ${contractorName}!</p>
          <p style="color: #B0C4DE;">Your bid on <strong style="color: #fff;">"${projectTitle}"</strong> has been selected. The client's contact information is now available in your project dashboard.</p>
          <p style="color: #B0C4DE;">Please reach out to the client as soon as possible to discuss next steps.</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/contractor/projects/${projectId}`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Project & Client Info
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendNewProjectEmail({
  contractorEmail,
  projectTitle,
  projectCategory,
  projectCity,
  projectId,
  deadline,
}: {
  contractorEmail: string;
  projectTitle: string;
  projectCategory: string;
  projectCity: string;
  projectId: string;
  deadline: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: contractorEmail,
    subject: `New Project Available: "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #60A5FA; margin-top: 0;">🔔 New Project Available</h2>
          <p style="color: #B0C4DE;">A new project matching your category has been posted:</p>
          <div style="background: #0A1628; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #fff; margin: 0 0 8px;">${projectTitle}</h3>
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">📍 ${projectCity}</p>
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">🏗 ${projectCategory}</p>
            <p style="color: #FBBF24; margin: 4px 0; font-size: 13px;">⏰ Bidding closes: ${new Date(deadline).toLocaleDateString()}</p>
          </div>
          <p style="color: #B0C4DE;">Log in to view the full project details and submit your bid before the deadline.</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/contractor/projects/${projectId}`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Project & Bid
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendEmergencyProjectEmail({
  contractorEmail,
  projectTitle,
  projectCategory,
  projectCity,
  projectId,
  autoCloseAt,
}: {
  contractorEmail: string;
  projectTitle: string;
  projectCategory: string;
  projectCity: string;
  projectId: string;
  autoCloseAt: string;
}) {
  const closingTime = new Date(autoCloseAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  await resend.emails.send({
    from: FROM,
    to: contractorEmail,
    subject: `🚨 Emergency Bid Request: "${projectTitle}" — Closes in 48 Hours`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #7C1A00; border: 1px solid #C2410C; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FDBA74; margin-top: 0;">🚨 Emergency Bid Request</h2>
          <p style="color: #FED7AA;">A client has posted an emergency project in your service area:</p>
          <div style="background: #0A1628; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #fff; margin: 0 0 8px;">${projectTitle}</h3>
            <p style="color: #FDBA74; margin: 4px 0; font-size: 13px;">📍 ${projectCity}</p>
            <p style="color: #FDBA74; margin: 4px 0; font-size: 13px;">🏗 ${projectCategory}</p>
            <p style="color: #F87171; margin: 8px 0 0; font-size: 13px; font-weight: bold;">⏰ Auto-closes: ${closingTime}</p>
          </div>
          <p style="color: #FED7AA; font-size: 13px; line-height: 1.6;">
            <strong style="color: #FDBA74;">Emergency bids are preliminary.</strong> No site visit is required — bid based on the information provided. Your bid will be visible to the client immediately upon submission. Both parties understand pricing will be refined after a site visit.
          </p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #7A9CC4;">
          Emergency projects pay faster but require quick response. Contractors who respond promptly have an edge. You can disable these alerts in your contractor settings.
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/contractor/projects/${projectId}`)}"
             style="background: #C2410C; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 15px;">
            🚨 View &amp; Bid Now
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendInspectorAssignedEmail({
  inspectorEmail,
  inspectorName,
  projectTitle,
  projectCity,
  assignmentId,
}: {
  inspectorEmail: string;
  inspectorName: string;
  projectTitle: string;
  projectCity: string;
  assignmentId: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: inspectorEmail,
    subject: `New Takeoff Assignment: "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">🔍 New Takeoff Assignment</h2>
          <p style="color: #B0C4DE;">Hello ${inspectorName},</p>
          <p style="color: #B0C4DE;">You have been assigned a new project takeoff:</p>
          <div style="background: #0A1628; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #fff; margin: 0 0 8px;">${projectTitle}</h3>
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">📍 ${projectCity}</p>
          </div>
          <p style="color: #B0C4DE;">Please log in to view the project details and submit your takeoff report.</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/inspector/projects/${assignmentId}`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Assignment
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendInspectorRequestAvailableEmail({
  inspectorEmail,
  projectTitle,
  projectCity,
  projectCategory,
  inspectionType,
  inspectorShareCents,
}: {
  inspectorEmail: string;
  projectTitle: string;
  projectCity: string;
  projectCategory: string;
  inspectionType: string;
  inspectorShareCents: number;
}) {
  const shareFormatted = `$${(inspectorShareCents / 100).toFixed(0)}`;
  await resend.emails.send({
    from: FROM,
    to: inspectorEmail,
    subject: `New Paid Inspection Request: "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">🔍 New Inspection Request — Payment Confirmed</h2>
          <p style="color: #B0C4DE;">A client has paid for a bid-accuracy inspection. An admin will assign this project shortly.</p>
          <div style="background: #0A1628; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #fff; margin: 0 0 8px;">${projectTitle}</h3>
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">📍 ${projectCity}</p>
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">🏗 ${projectCategory}</p>
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">🔍 ${inspectionType}</p>
            <p style="color: #4ADE80; margin: 8px 0 0; font-size: 13px; font-weight: bold;">💰 Inspector earnings for this assignment: ${shareFormatted}</p>
          </div>
          <p style="color: #B0C4DE;">Log in to view your assignments dashboard.</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/inspector/projects`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View My Assignments
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendInspectorPaymentConfirmedEmail({
  clientEmail,
  clientName,
  projectTitle,
  inspectionType,
  feeCents,
  projectId,
}: {
  clientEmail: string;
  clientName: string;
  projectTitle: string;
  inspectionType: string;
  feeCents: number;
  projectId: string;
}) {
  const feeFormatted = `$${(feeCents / 100).toFixed(0)}`;
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Inspection Payment Confirmed — "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #052E16; border: 1px solid #166534; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #4ADE80; margin-top: 0;">✅ Payment Confirmed</h2>
          <p style="color: #B0C4DE;">Hello ${clientName},</p>
          <p style="color: #B0C4DE;">Your inspection payment for <strong style="color: #fff;">"${projectTitle}"</strong> has been received.</p>
          <div style="background: #0A1628; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">🔍 Inspection type: <strong style="color: #fff;">${inspectionType}</strong></p>
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">💰 Amount paid: <strong style="color: #4ADE80;">${feeFormatted}</strong></p>
          </div>
          <p style="color: #B0C4DE;">An ONP inspector will be assigned to your project within 1–2 business days. Most inspections take place within <strong style="color: #fff;">3–5 business days</strong> of payment.</p>
          <p style="color: #B0C4DE;">You will receive another email once an inspector is assigned and a visit has been scheduled. You can track your inspection status in your project dashboard at any time.</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/client/projects/${projectId}/inspector`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Inspection Status
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

// ─── On-site upgrade emails ────────────────────────────────────────────────

export async function sendInspectorUpgradeRequestedEmail({
  clientEmail,
  projectTitle,
  projectId,
  justification,
  upgradeFeeCents,
}: {
  clientEmail: string;
  projectTitle: string;
  projectId: string;
  justification: string;
  upgradeFeeCents: number;
}) {
  const feeFormatted = `$${(upgradeFeeCents / 100).toFixed(0)}`;
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Your inspector has requested an upgrade — "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Inspection Update</p>
        </div>
        <div style="background: #2D1B00; border: 1px solid #FBBF24; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">⚠ Inspection Upgrade Requested</h2>
          <p style="color: #FDE68A;">Your inspector has reviewed the project on-site and has requested an upgrade from Standard to Comprehensive Inspection for <strong>"${projectTitle}"</strong>.</p>
          <div style="background: #0A1628; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="color: #7A9CC4; margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Inspector's reason:</p>
            <p style="color: #F0F4FF; margin: 0; font-style: italic;">"${justification}"</p>
          </div>
          <p style="color: #FDE68A; font-weight: bold;">Additional charge: ${feeFormatted}</p>
          <p style="color: #FDE68A; font-size: 13px;">You may pay for the upgrade or decline it. If you decline, your inspector will proceed with the Standard inspection.</p>
        </div>
        <div style="text-align: center; margin-bottom: 16px;">
          <a href="${loginLink(`/dashboard/client/projects/${projectId}/inspector/upgrade-pay`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Review Upgrade Request
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendInspectorUpgradeChargedEmail({
  clientEmail,
  projectTitle,
  projectId,
  upgradeFeeCents,
}: {
  clientEmail: string;
  projectTitle: string;
  projectId: string;
  upgradeFeeCents: number;
}) {
  const feeFormatted = `$${(upgradeFeeCents / 100).toFixed(0)}`;
  const disputeDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString();
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Upgrade confirmed — "${projectTitle}" upgraded to Comprehensive`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Inspection Update</p>
        </div>
        <div style="background: #052E16; border: 1px solid #166534; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #4ADE80; margin-top: 0;">✅ Upgrade Payment Confirmed</h2>
          <p style="color: #BBF7D0;">Your inspection for <strong>"${projectTitle}"</strong> has been upgraded to Comprehensive. Your inspector will proceed with the extended scope.</p>
          <p style="color: #4ADE80; font-weight: bold; font-size: 16px;">Additional charge: ${feeFormatted}</p>
        </div>
        <div style="background: #2D1B00; border: 1px solid #FBBF24; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #FBBF24; margin-top: 0; font-size: 14px;">Independent Review Available</h3>
          <p style="color: #FDE68A; font-size: 13px; line-height: 1.6;">If you believe this upgrade was not justified, you have 14 days to request a free review by an independent Master Inspector. The deadline is <strong>${disputeDeadline}</strong>.</p>
          <a href="${loginLink(`/dashboard/client/projects/${projectId}/inspector`)}"
             style="color: #FBBF24; font-size: 13px; text-decoration: underline;">
            Request a review from your project page →
          </a>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/client/projects/${projectId}/inspector`)}"
             style="background: #1B4F8A; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Inspection Status
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendInspectorUpgradeConfirmedEmail({
  inspectorEmail,
  projectTitle,
  projectId,
  assignmentId,
}: {
  inspectorEmail: string;
  projectTitle: string;
  projectId: string;
  assignmentId: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: inspectorEmail,
    subject: `Upgrade approved — proceed with Comprehensive on "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Inspector Notification</p>
        </div>
        <div style="background: #052E16; border: 1px solid #166534; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #4ADE80; margin-top: 0;">✅ Client Approved the Upgrade</h2>
          <p style="color: #BBF7D0;">The client has paid for the upgrade on <strong>"${projectTitle}"</strong>. Please proceed with the Comprehensive inspection scope.</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/inspector/projects/${assignmentId}`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Assignment
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendInspectorUpgradeDeclinedEmail({
  inspectorEmail,
  projectTitle,
  projectId,
  assignmentId,
}: {
  inspectorEmail: string;
  projectTitle: string;
  projectId: string;
  assignmentId: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: inspectorEmail,
    subject: `Upgrade declined — proceed with Standard on "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Inspector Notification</p>
        </div>
        <div style="background: #1A0D00; border: 1px solid #C2410C; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FB923C; margin-top: 0;">ℹ Upgrade Declined by Client</h2>
          <p style="color: #FED7AA;">The client has declined the upgrade on <strong>"${projectTitle}"</strong>. Please proceed with the original Standard inspection scope.</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/inspector/projects/${assignmentId}`)}"
             style="background: #1B4F8A; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Assignment
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendAdminInspectorRequestEmail({
  adminEmail,
  projectTitle,
  projectCity,
  projectCategory,
  inspectionType,
  feeCents,
  inspectorShareCents,
  projectId,
  assignmentId,
}: {
  adminEmail: string;
  projectTitle: string;
  projectCity: string;
  projectCategory: string;
  inspectionType: string;
  feeCents: number;
  inspectorShareCents: number;
  projectId: string;
  assignmentId: string;
}) {
  const feeFormatted = `$${(feeCents / 100).toFixed(0)}`;
  const onpShareFormatted = `$${((feeCents - inspectorShareCents) / 100).toFixed(0)}`;
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `[ACTION REQUIRED] New Paid Inspector Request — "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Admin Notification</p>
        </div>
        <div style="background: #2D1B00; border: 1px solid #FBBF24; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">⚡ New Inspector Assignment Needed</h2>
          <p style="color: #FDE68A;">A client has paid for an inspection. Please assign an available inspector.</p>
          <div style="background: #0A1628; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #fff; margin: 0 0 8px;">${projectTitle}</h3>
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">📍 ${projectCity}</p>
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">🏗 ${projectCategory}</p>
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">🔍 ${inspectionType}</p>
            <p style="color: #4ADE80; margin: 8px 0 0; font-size: 13px;">💰 Fee collected: <strong>${feeFormatted}</strong> · ONP share: <strong>${onpShareFormatted}</strong></p>
          </div>
        </div>
        <div style="text-align: center;">
          <a href="${BASE}/dashboard/admin/projects/${projectId}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Assign Inspector
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          ONP Admin · Assignment ID: ${assignmentId}
        </p>
      </div>
    `,
  });
}