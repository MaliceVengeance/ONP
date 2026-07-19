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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">⚠ New Question Submitted</h2>
          <p style="color: #B0C4DE;">Hello ${clientName},</p>
          <p style="color: #B0C4DE;">A contractor has submitted a question on your project <strong style="color: #fff;">"${projectTitle}"</strong>:</p>
          <div style="background: #1E3A8A; border-left: 3px solid #C8102E; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #4ADE80; margin-top: 0;">✅ Question Answered</h2>
          <p style="color: #B0C4DE;">Your question on <strong style="color: #fff;">"${projectTitle}"</strong> has been answered:</p>
          <div style="background: #1E3A8A; border-left: 3px solid #7A9CC4; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="color: #7A9CC4; margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Question</p>
            <p style="color: #F0F4FF; margin: 0; font-style: italic;">"${question}"</p>
          </div>
          <div style="background: #1E3A8A; border-left: 3px solid #4ADE80; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #60A5FA; margin-top: 0;">🔔 New Project Available</h2>
          <p style="color: #B0C4DE;">A new project matching your category has been posted:</p>
          <div style="background: #1E3A8A; border-radius: 8px; padding: 16px; margin: 16px 0;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #7C1A00; border: 1px solid #C2410C; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FDBA74; margin-top: 0;">🚨 Emergency Bid Request</h2>
          <p style="color: #FED7AA;">A client has posted an emergency project in your service area:</p>
          <div style="background: #1E3A8A; border-radius: 8px; padding: 16px; margin: 16px 0;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">🔍 New Takeoff Assignment</h2>
          <p style="color: #B0C4DE;">Hello ${inspectorName},</p>
          <p style="color: #B0C4DE;">You have been assigned a new project takeoff:</p>
          <div style="background: #1E3A8A; border-radius: 8px; padding: 16px; margin: 16px 0;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">🔍 New Inspection Request — Payment Confirmed</h2>
          <p style="color: #B0C4DE;">A client has paid for a bid-accuracy inspection. An admin will assign this project shortly.</p>
          <div style="background: #1E3A8A; border-radius: 8px; padding: 16px; margin: 16px 0;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #052E16; border: 1px solid #166534; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #4ADE80; margin-top: 0;">✅ Payment Confirmed</h2>
          <p style="color: #B0C4DE;">Hello ${clientName},</p>
          <p style="color: #B0C4DE;">Your inspection payment for <strong style="color: #fff;">"${projectTitle}"</strong> has been received.</p>
          <div style="background: #1E3A8A; border-radius: 8px; padding: 16px; margin: 16px 0;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Inspection Update</p>
        </div>
        <div style="background: #2D1B00; border: 1px solid #FBBF24; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">⚠ Inspection Upgrade Requested</h2>
          <p style="color: #FDE68A;">Your inspector has reviewed the project on-site and has requested an upgrade from Standard to Comprehensive Inspection for <strong>"${projectTitle}"</strong>.</p>
          <div style="background: #1E3A8A; border-radius: 8px; padding: 16px; margin: 16px 0;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Admin Notification</p>
        </div>
        <div style="background: #2D1B00; border: 1px solid #FBBF24; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">⚡ New Inspector Assignment Needed</h2>
          <p style="color: #FDE68A;">A client has paid for an inspection. Please assign an available inspector.</p>
          <div style="background: #1E3A8A; border-radius: 8px; padding: 16px; margin: 16px 0;">
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

export async function sendCredentialSubmittedAdminEmail({
  adminEmail,
  businessName,
  credentialType,
  trade,
  state,
  city,
  contractorId,
}: {
  adminEmail: string;
  businessName: string;
  credentialType: string;
  trade: string | null;
  state: string | null;
  city: string | null;
  contractorId: string;
}) {
  const location = [city, state].filter(Boolean).join(", ") || "location not set";
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `[ACTION REQUIRED] New Credential Submitted — ${businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Admin Notification</p>
        </div>
        <div style="background: #2D1B00; border: 1px solid #FBBF24; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">📜 New License/Bonding Credential Pending Review</h2>
          <p style="color: #FDE68A;">A contractor submitted a credential that needs verification.</p>
          <div style="background: #1E3A8A; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #fff; margin: 0 0 8px;">${businessName}</h3>
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">📍 ${location}</p>
            <p style="color: #7A9CC4; margin: 4px 0; font-size: 13px;">📄 ${credentialType}${trade ? ` · ${trade}` : ""}</p>
          </div>
        </div>
        <div style="text-align: center;">
          <a href="${BASE}/dashboard/admin/vet-certification?tab=credentials"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Review Credential
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          ONP Admin · Contractor ID: ${contractorId}
        </p>
      </div>
    `,
  });
}

// ── Dispute emails ────────────────────────────────────────────────────────────

export async function sendDisputeSubmittedClientEmail({
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
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Dispute Received — "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #4ADE80; margin-top: 0;">✅ Dispute Received</h2>
          <p style="color: #B0C4DE;">We've received your dispute of the ${feeFormatted} upgrade charge on <strong style="color: #fff;">"${projectTitle}"</strong>.</p>
          <p style="color: #B0C4DE;">An independent Master Inspector will review your case. Here's what happens next:</p>
          <ul style="color: #B0C4DE; padding-left: 20px; line-height: 2;">
            <li>Your original inspector has <strong style="color: #fff;">3 business days</strong> to provide their statement.</li>
            <li>A Master Inspector will be assigned to review both sides.</li>
            <li>You will receive a written decision within <strong style="color: #fff;">5 business days</strong>.</li>
            <li>The upgrade charge is held in escrow until the dispute is resolved.</li>
          </ul>
          <p style="color: #B0C4DE;">The review is free and will not affect your account.</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/client/projects/${projectId}/inspector`)}"
             style="background: #1B4F8A; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Dispute Status
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendDisputeFiledInspectorEmail({
  inspectorEmail,
  projectTitle,
  projectId,
  assignmentId,
  disputeId,
}: {
  inspectorEmail: string;
  projectTitle: string;
  projectId: string;
  assignmentId: string;
  disputeId: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: inspectorEmail,
    subject: `[ACTION REQUIRED] Upgrade Dispute Filed — "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Inspector Notice</p>
        </div>
        <div style="background: #2D1B00; border: 1px solid #FBBF24; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">⚠ Dispute Filed Against Your Upgrade</h2>
          <p style="color: #FDE68A;">A client has filed a dispute of the on-site upgrade you requested on <strong style="color: #fff;">"${projectTitle}"</strong>.</p>
          <p style="color: #FDE68A;">An independent Master Inspector will review the upgrade decision. You are invited to provide your statement explaining why the upgrade was necessary.</p>
          <div style="background: #1E3A8A; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="color: #FBBF24; margin: 0; font-weight: bold;">Deadline: 3 business days</p>
            <p style="color: #7A9CC4; margin: 8px 0 0; font-size: 13px;">If no response is received, the Master Inspector will still render a decision. Non-response is noted on your record.</p>
          </div>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/inspector/projects/${assignmentId}`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Provide Your Statement
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          ONP Inspector Notice · Dispute ID: ${disputeId}
        </p>
      </div>
    `,
  });
}

export async function sendDisputeAdminEmail({
  adminEmail,
  projectTitle,
  projectId,
  disputeId,
  upgradeFeeCents,
}: {
  adminEmail: string;
  projectTitle: string;
  projectId: string;
  disputeId: string;
  upgradeFeeCents: number;
}) {
  const feeFormatted = `$${(upgradeFeeCents / 100).toFixed(0)}`;
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `[DISPUTE] New Upgrade Dispute — "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Admin Notification</p>
        </div>
        <div style="background: #2D1B00; border: 1px solid #FBBF24; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">⚠ New Upgrade Dispute Filed</h2>
          <p style="color: #FDE68A;">A client has disputed a ${feeFormatted} on-site upgrade charge on <strong style="color: #fff;">"${projectTitle}"</strong>.</p>
          <p style="color: #FDE68A;">A Master Inspector needs to be assigned. The 5-business-day SLA begins once assigned.</p>
        </div>
        <div style="text-align: center;">
          <a href="${BASE}/dashboard/admin/disputes/${disputeId}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Dispute
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          ONP Admin · Dispute ID: ${disputeId}
        </p>
      </div>
    `,
  });
}

export async function sendDisputeResolvedClientEmail({
  clientEmail,
  projectTitle,
  projectId,
  decision,
  reasoning,
  upgradeFeeCents,
  refundCents,
  creditCents,
}: {
  clientEmail: string;
  projectTitle: string;
  projectId: string;
  decision: string;
  reasoning: string;
  upgradeFeeCents: number;
  refundCents: number;
  creditCents: number;
}) {
  const fmt = (c: number) => `$${(c / 100).toFixed(0)}`;
  const isJustified = decision === "RESOLVED_UPGRADE_JUSTIFIED";
  const isPartial   = decision === "RESOLVED_PARTIAL_CREDIT";
  const isRefund    = decision === "RESOLVED_REFUND";

  const outcomeTitle = isJustified
    ? "Upgrade Justified — Charge Stands"
    : isPartial
    ? `Upgrade: Partial Credit of ${fmt(creditCents)} Applied`
    : `Upgrade Not Justified — Full Refund of ${fmt(upgradeFeeCents)}`;

  const outcomeColor  = isRefund ? "#15803D" : isPartial ? "#1B4F8A" : "#92400E";
  const outcomeBg     = isRefund ? "#F0FDF4" : isPartial ? "#EEF4FF" : "#FFFBEB";
  const outcomeBorder = isRefund ? "#166534" : isPartial ? "#B8D0E8" : "#FCD34D";

  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Dispute Resolved — "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Dispute Resolution</p>
        </div>
        <div style="background: ${outcomeBg}; border: 1px solid ${outcomeBorder}; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: ${outcomeColor}; margin-top: 0; font-size: 18px;">${outcomeTitle}</h2>
          <p style="color: #1E3A8A; font-size: 13px; line-height: 1.6; margin-bottom: 0;">
            A Master Inspector has reviewed your dispute on <strong>"${projectTitle}"</strong>.
          </p>
        </div>
        <div style="background: #122040; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 12px; color: #7A9CC4; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Master Inspector's Reasoning</div>
          <p style="color: #F0F4FF; font-size: 13px; line-height: 1.7; margin: 0; font-style: italic;">"${reasoning}"</p>
        </div>
        ${isRefund ? `
        <div style="background: #F0FDF4; border: 1px solid #166534; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #166534; font-size: 13px; margin: 0;"><strong>✅ A refund of ${fmt(upgradeFeeCents)} has been processed to your original payment method.</strong> Please allow 5–10 business days for it to appear.</p>
        </div>` : ""}
        ${isPartial ? `
        <div style="background: #EEF4FF; border: 1px solid #B8D0E8; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #1B4F8A; font-size: 13px; margin: 0;"><strong>✅ A credit of ${fmt(creditCents)} has been added to your ONP account.</strong> Use it toward any future inspection or emergency bid request.</p>
        </div>` : ""}
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/client/projects/${projectId}`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Project
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          ONP · The Master Inspector's decision is final.
        </p>
      </div>
    `,
  });
}

export async function sendDisputeResolvedInspectorEmail({
  inspectorEmail,
  projectTitle,
  assignmentId,
  decision,
  reasoning,
  upgradeFeeCents,
  flagAdded,
}: {
  inspectorEmail: string;
  projectTitle: string;
  assignmentId: string;
  decision: string;
  reasoning: string;
  upgradeFeeCents: number;
  flagAdded: boolean;
}) {
  const fmt = (c: number) => `$${(c / 100).toFixed(0)}`;
  const isJustified = decision === "RESOLVED_UPGRADE_JUSTIFIED";
  const isPartial   = decision === "RESOLVED_PARTIAL_CREDIT";
  const isRefund    = decision === "RESOLVED_REFUND";

  const outcomeTitle = isJustified
    ? "✅ Upgrade Justified — Decision in Your Favor"
    : isPartial
    ? "ℹ Upgrade: Reasonable Judgment Call — No Flag"
    : "⚠ Upgrade Not Justified — Refund Issued";

  const outerBg     = isJustified ? "#F0FDF4" : isPartial ? "#FFFBEB" : "#2D1B00";
  const outerBorder = isJustified ? "#166534" : isPartial ? "#FCD34D" : "#C2410C";
  const titleColor  = isJustified ? "#15803D" : isPartial ? "#92400E" : "#FCA5A5";
  const bodyColor   = isJustified ? "#166534" : isPartial ? "#78350F" : "#FDE68A";

  await resend.emails.send({
    from: FROM,
    to: inspectorEmail,
    subject: `Dispute Resolved — "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Inspector Notice</p>
        </div>
        <div style="background: ${outerBg}; border: 1px solid ${outerBorder}; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: ${titleColor}; margin-top: 0; font-size: 18px;">${outcomeTitle}</h2>
          <p style="color: ${bodyColor}; font-size: 13px; line-height: 1.6; margin-bottom: 0;">
            A Master Inspector has reviewed the dispute on your upgrade for <strong>"${projectTitle}"</strong>.
          </p>
        </div>
        <div style="background: #122040; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 12px; color: #7A9CC4; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Master Inspector's Reasoning</div>
          <p style="color: #F0F4FF; font-size: 13px; line-height: 1.7; margin: 0; font-style: italic;">"${reasoning}"</p>
        </div>
        ${flagAdded ? `
        <div style="background: #2D1B00; border: 1px solid #C2410C; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #FCA5A5; font-size: 13px; margin: 0 0 8px;"><strong>⚠ A flag has been added to your inspector record.</strong></p>
          <p style="color: #FDE68A; font-size: 12px; margin: 0; line-height: 1.6;">
            Flags are tracked on a rate basis relative to your total inspection volume. If you have concerns, contact <a href="mailto:support@ournextproject.us" style="color: #FBBF24;">support@ournextproject.us</a>.
          </p>
        </div>` : ""}
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/inspector/projects/${assignmentId}`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Assignment
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          ONP Inspector Notice · The ${fmt(upgradeFeeCents)} upgrade fee has been ${isRefund ? "refunded to the client" : isPartial ? "partially credited to the client" : "released from escrow"}.
        </p>
      </div>
    `,
  });
}

export async function sendDisputeAssignedMasterInspectorEmail({
  masterInspectorEmail,
  projectTitle,
  disputeId,
}: {
  masterInspectorEmail: string;
  projectTitle: string;
  disputeId: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: masterInspectorEmail,
    subject: `[ACTION REQUIRED] New Dispute Assigned — "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Master Inspector</p>
        </div>
        <div style="background: #122040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #fff; margin-top: 0; font-size: 18px;">New Dispute Assigned to You</h2>
          <p style="color: #B8D0E8; font-size: 13px; line-height: 1.6;">
            A client has disputed an on-site upgrade charge on <strong style="color: #fff;">"${projectTitle}"</strong>.
            As the assigned Master Inspector, please review all case evidence and render a decision.
          </p>
          <div style="background: #1E3A8A; border-radius: 8px; padding: 16px; margin-top: 16px;">
            <p style="color: #FBBF24; margin: 0; font-weight: bold;">⏰ SLA: 5 business days from today</p>
            <p style="color: #7A9CC4; font-size: 12px; margin: 8px 0 0;">
              A reminder will be sent at day 3. If unresolved by day 5, the case may be reassigned.
            </p>
          </div>
        </div>
        <div style="text-align: center;">
          <a href="${BASE}/dashboard/inspector/disputes/${disputeId}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Review Dispute
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          ONP · Dispute ID: ${disputeId}
        </p>
      </div>
    `,
  });
}

export async function sendInspectorFlagThresholdEmail({
  inspectorEmail,
  status,
  flags12mo,
  inspections12mo,
  flagRatePct,
}: {
  inspectorEmail: string;
  status: "MANDATORY_REVIEW" | "SUSPENSION_RECOMMENDED";
  flags12mo: number;
  inspections12mo: number;
  flagRatePct: string;
}) {
  const isSuspension = status === "SUSPENSION_RECOMMENDED";
  await resend.emails.send({
    from: FROM,
    to: inspectorEmail,
    subject: isSuspension
      ? "[URGENT] Your Inspector Account Is Under Suspension Review"
      : "[ACTION REQUIRED] Your Inspector Account Is Under Mandatory Review",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Inspector Notice</p>
        </div>
        <div style="background: #2D1B00; border: 1px solid #C2410C; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FCA5A5; margin-top: 0; font-size: 18px;">
            ${isSuspension ? "⛔ Suspension Review Triggered" : "⚠ Mandatory Account Review"}
          </h2>
          <p style="color: #FDE68A; font-size: 13px; line-height: 1.6; margin-bottom: 12px;">
            Based on your upgrade dispute history over the last 12 months, your account has been flagged
            for ${isSuspension ? "suspension review" : "mandatory review"} by the ONP compliance system.
          </p>
          <div style="background: #1E3A8A; border-radius: 8px; padding: 14px; font-size: 12px; color: #B8D0E8;">
            <div style="margin-bottom: 4px;">Disputed upgrades (12 mo): <strong style="color: #fff;">${flags12mo}</strong></div>
            <div style="margin-bottom: 4px;">Total inspections (12 mo): <strong style="color: #fff;">${inspections12mo}</strong></div>
            <div>Dispute rate: <strong style="color: #FCA5A5;">${flagRatePct}%</strong></div>
          </div>
        </div>
        <div style="background: #122040; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #B8D0E8; line-height: 1.6;">
          <strong style="color: #fff;">What this means:</strong><br/>
          Your ability to request on-site upgrade charges has been paused pending review.
          An ONP administrator will contact you within 2 business days.
          ${isSuspension ? "Platform suspension may follow if the review confirms a pattern of unjustified upgrades." : ""}
        </div>
        <p style="color: #7A9CC4; font-size: 12px; text-align: center;">
          Questions? Contact <a href="mailto:support@ournextproject.us" style="color: #4A9EF5;">support@ournextproject.us</a>
        </p>
      </div>
    `,
  });
}

export async function sendAdminInspectorFlagThresholdEmail({
  adminEmail,
  inspectorId,
  status,
  flags12mo,
  inspections12mo,
  flagRatePct,
}: {
  adminEmail: string;
  inspectorId: string;
  status: "MANDATORY_REVIEW" | "SUSPENSION_RECOMMENDED";
  flags12mo: number;
  inspections12mo: number;
  flagRatePct: string;
}) {
  const isSuspension = status === "SUSPENSION_RECOMMENDED";
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: isSuspension
      ? `[URGENT] Inspector Suspension Threshold Reached`
      : `[ACTION REQUIRED] Inspector Mandatory Review Threshold Reached`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Admin Alert</p>
        </div>
        <div style="background: #2D1B00; border: 1px solid #C2410C; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FCA5A5; margin-top: 0; font-size: 18px;">
            ${isSuspension ? "⛔ Inspector Reached Suspension Threshold" : "⚠ Inspector Reached Mandatory Review Threshold"}
          </h2>
          <p style="color: #FDE68A; font-size: 13px; line-height: 1.6; margin-bottom: 12px;">
            An inspector's upgrade dispute rate has crossed the
            ${isSuspension ? "suspension recommendation threshold (≥15%)" : "mandatory review threshold (≥10%)"}
            based on the last 12 months of activity.
          </p>
          <div style="background: #1E3A8A; border-radius: 8px; padding: 14px; font-size: 12px; color: #B8D0E8;">
            <div style="margin-bottom: 4px;">Inspector ID: <strong style="color: #fff; font-family: monospace;">${inspectorId}</strong></div>
            <div style="margin-bottom: 4px;">Disputed upgrades (12 mo): <strong style="color: #fff;">${flags12mo}</strong></div>
            <div style="margin-bottom: 4px;">Total inspections (12 mo): <strong style="color: #fff;">${inspections12mo}</strong></div>
            <div>Dispute rate: <strong style="color: #FCA5A5;">${flagRatePct}%</strong></div>
          </div>
        </div>
        <div style="background: #122040; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #B8D0E8; line-height: 1.6;">
          <strong style="color: #fff;">Automatic actions taken:</strong><br/>
          • Upgrade request capability has been blocked on this inspector's account<br/>
          • Inspector has been notified by email<br/>
          ${isSuspension ? "• <strong style='color: #FCA5A5;'>Strong recommendation: suspend this inspector from the platform</strong>" : "• Admin review and decision required within 2 business days"}
        </div>
        <div style="text-align: center;">
          <a href="${BASE}/dashboard/admin/users/${inspectorId}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Inspector Profile
          </a>
        </div>
      </div>
    `,
  });
}

export async function sendDisputeSlaReminderEmail({
  masterInspectorEmail,
  projectTitle,
  disputeId,
  daysAssigned,
  daysRemaining,
}: {
  masterInspectorEmail: string;
  projectTitle: string;
  disputeId: string;
  daysAssigned: number;
  daysRemaining: number;
}) {
  await resend.emails.send({
    from: FROM,
    to: masterInspectorEmail,
    subject: `[REMINDER] Dispute Review Due in ${daysRemaining} Day${daysRemaining === 1 ? "" : "s"} — "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Master Inspector</p>
        </div>
        <div style="background: #2D1B00; border: 1px solid #FCD34D; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0; font-size: 18px;">⏰ Dispute Review Reminder</h2>
          <p style="color: #FDE68A; font-size: 13px; line-height: 1.6;">
            You were assigned a dispute review on <strong style="color: #fff;">"${projectTitle}"</strong>
            ${daysAssigned} day${daysAssigned === 1 ? "" : "s"} ago. A decision is due within <strong style="color: #fff;">${daysRemaining} more day${daysRemaining === 1 ? "" : "s"}</strong>.
          </p>
          <p style="color: #FDE68A; font-size: 13px; line-height: 1.6; margin-bottom: 0;">
            If the dispute is not resolved by the 5-business-day deadline, it may be reassigned or escalated to admin.
          </p>
        </div>
        <div style="text-align: center;">
          <a href="${BASE}/dashboard/inspector/disputes/${disputeId}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Review Now
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          ONP · Dispute ID: ${disputeId}
        </p>
      </div>
    `,
  });
}

export async function sendDisputeSlaEscalationEmail({
  masterInspectorEmail,
  adminEmail,
  projectTitle,
  disputeId,
}: {
  masterInspectorEmail: string | null;
  adminEmail: string;
  projectTitle: string;
  disputeId: string;
}) {
  const promises: Promise<void>[] = [];

  if (masterInspectorEmail) {
    promises.push(
      resend.emails.send({
        from: FROM,
        to: masterInspectorEmail,
        subject: `[URGENT] Dispute Review SLA Breached — "${projectTitle}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
              <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Master Inspector</p>
            </div>
            <div style="background: #2D1B00; border: 1px solid #C2410C; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #FCA5A5; margin-top: 0; font-size: 18px;">⛔ SLA Deadline Breached</h2>
              <p style="color: #FDE68A; font-size: 13px; line-height: 1.6;">
                The 5-business-day review window for <strong style="color: #fff;">"${projectTitle}"</strong> has elapsed without a decision.
                An administrator has been notified and may reassign this dispute.
              </p>
              <p style="color: #FDE68A; font-size: 13px; line-height: 1.6; margin-bottom: 0;">
                Please submit your decision immediately if you intend to retain this case.
              </p>
            </div>
            <div style="text-align: center;">
              <a href="${BASE}/dashboard/inspector/disputes/${disputeId}"
                 style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Submit Decision Now
              </a>
            </div>
            <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
              ONP · Dispute ID: ${disputeId}
            </p>
          </div>
        `,
      }).then(() => {})
    );
  }

  promises.push(
    resend.emails.send({
      from: FROM,
      to: adminEmail,
      subject: `[URGENT] Master Inspector SLA Breached — "${projectTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
            <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Admin Alert</p>
          </div>
          <div style="background: #2D1B00; border: 1px solid #C2410C; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #FCA5A5; margin-top: 0; font-size: 18px;">⛔ Master Inspector SLA Breached</h2>
            <p style="color: #FDE68A; font-size: 13px; line-height: 1.6;">
              The dispute on <strong style="color: #fff;">"${projectTitle}"</strong> has not been resolved within the 5-business-day SLA.
              The assigned Master Inspector has been notified. Admin action may be required.
            </p>
          </div>
          <div style="text-align: center;">
            <a href="${BASE}/dashboard/admin/disputes/${disputeId}"
               style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
              View Dispute
            </a>
          </div>
          <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
            ONP Admin · Dispute ID: ${disputeId}
          </p>
        </div>
      `,
    }).then(() => {})
  );

  await Promise.allSettled(promises);
}

export async function sendCreditExpiryReminderEmail({
  clientEmail,
  amountCents,
  expiresAt,
}: {
  clientEmail: string;
  amountCents: number;
  expiresAt: string;
}) {
  const fmt = (c: number) => `$${(c / 100).toFixed(0)}`;
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Your ${fmt(amountCents)} ONP Credit Expires Soon`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Account Credit</p>
        </div>
        <div style="background: #122040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #fff; margin-top: 0; font-size: 20px;">Your ${fmt(amountCents)} credit expires in 30 days</h2>
          <p style="color: #B8D0E8; font-size: 13px; line-height: 1.6;">
            A credit of <strong style="color: #fff;">${fmt(amountCents)}</strong> on your ONP account will expire on
            <strong style="color: #fff;">${expiryDate}</strong>. Use it toward your next inspection or emergency bid request before it expires.
          </p>
        </div>
        <div style="text-align: center;">
          <a href="${BASE}/dashboard/client/credits"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View My Credits
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          ONP · Credits can be applied at checkout for any inspection or emergency bid.
        </p>
      </div>
    `,
  });
}

export async function sendNoMasterInspectorAvailableAdminEmail({
  adminEmail,
  projectTitle,
  disputeId,
}: {
  adminEmail: string;
  projectTitle: string;
  disputeId: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `[URGENT] No Master Inspector Available — Manual Assignment Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Admin Alert</p>
        </div>
        <div style="background: #2D1B00; border: 1px solid #C2410C; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FCA5A5; margin-top: 0;">⚠ No Master Inspector Available</h2>
          <p style="color: #FDE68A; font-size: 13px; line-height: 1.6;">
            A dispute was filed on <strong style="color: #fff;">"${projectTitle}"</strong> but the system
            could not automatically assign a Master Inspector. Manual assignment is required immediately.
          </p>
          <p style="color: #FDE68A; font-size: 13px; line-height: 1.6; margin-bottom: 0;">
            This may occur when the original inspector is the only available Master Inspector, or when the
            Master Inspector pool is empty.
          </p>
        </div>
        <div style="text-align: center;">
          <a href="${BASE}/dashboard/admin/disputes/${disputeId}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Assign Manually
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          ONP Admin · Dispute ID: ${disputeId}
        </p>
      </div>
    `,
  });
}

export async function sendCompletionRequestedEmail({
  clientEmail,
  clientName,
  contractorName,
  projectTitle,
  projectId,
}: {
  clientEmail: string;
  clientName: string;
  contractorName: string;
  projectTitle: string;
  projectId: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `${contractorName} has marked work complete on "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #34D399; margin-top: 0;">✅ Work Completion Signaled</h2>
          <p style="color: #B0C4DE;">Hello ${clientName},</p>
          <p style="color: #B0C4DE;">
            <strong style="color: #fff;">${contractorName}</strong> has signaled that work on your project
            <strong style="color: #fff;">"${projectTitle}"</strong> is complete.
          </p>
          <p style="color: #B0C4DE;">
            Please log in to review and confirm completion, or dismiss the request if the work is not yet finished.
          </p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/client/projects/${projectId}`)}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Review &amp; Confirm
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendCompletionConfirmedEmail({
  contractorEmail,
  projectTitle,
  projectId,
}: {
  contractorEmail: string;
  projectTitle: string;
  projectId: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: contractorEmail,
    subject: `Project complete — "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0D2D1A; border: 1px solid #065F46; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #34D399; margin-top: 0;">🎉 Project Confirmed Complete</h2>
          <p style="color: #B0C4DE;">
            The client has confirmed that project <strong style="color: #fff;">"${projectTitle}"</strong> is complete.
          </p>
          <p style="color: #B0C4DE;">Congratulations on completing the project through ONP. The project is now marked as COMPLETED.</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(`/dashboard/contractor/projects/${projectId}`)}"
             style="background: #065F46; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
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

export async function sendProjectMessageNotificationEmail({
  recipientEmail,
  recipientName,
  senderName,
  senderRole,
  projectTitle,
  projectId,
  messageCount,
  dashboardPath,
}: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderRole: "CLIENT" | "CONTRACTOR" | "ADMIN";
  projectTitle: string;
  projectId: string;
  messageCount: number;
  dashboardPath: string;
}) {
  const roleLabel =
    senderRole === "CLIENT" ? "the project client" :
    senderRole === "CONTRACTOR" ? "the awarded contractor" :
    "ONP Support";

  const subject =
    messageCount === 1
      ? `New message on "${projectTitle}" from ${senderName}`
      : `${messageCount} new messages on "${projectTitle}"`;

  await resend.emails.send({
    from: FROM,
    to: recipientEmail,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">💬 ${messageCount === 1 ? "New Message" : `${messageCount} New Messages`}</h2>
          <p style="color: #B0C4DE;">Hello ${recipientName},</p>
          <p style="color: #B0C4DE;">
            You have ${messageCount === 1 ? "a new message" : `${messageCount} new messages`} on project
            <strong style="color: #fff;">"${projectTitle}"</strong>
            from <strong style="color: #fff;">${senderName}</strong> (${roleLabel}).
          </p>
          <p style="color: #B0C4DE;">Log in to read and reply — messages are private between you, the contractor, and ONP.</p>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink(dashboardPath + "#messages")}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Messages
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}

export async function sendWaitlistExpansionEmail({
  toEmail,
  zip,
  city,
  state,
  subject,
  body,
}: {
  toEmail: string;
  zip: string;
  city: string | null;
  state: string | null;
  subject: string;
  body: string;
}) {
  const locationLabel = city && state ? `${city}, ${state} ${zip}` : zip;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1E3A8A; color: #F0F4FF; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #fff; letter-spacing: 4px; margin: 0;">★ ONP ★</h1>
          <p style="color: #7A9CC4; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Our Next Project</p>
        </div>
        <div style="background: #0F2040; border: 1px solid #1B4F8A; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; margin-top: 0;">📍 ONP is Now in Your Area!</h2>
          <p style="color: #B0C4DE;">Hello,</p>
          <p style="color: #B0C4DE;">
            Great news — ONP has expanded to <strong style="color: #fff;">${locationLabel}</strong>.
          </p>
          <div style="white-space: pre-line; color: #B0C4DE; line-height: 1.6; margin-top: 16px;">${body}</div>
        </div>
        <div style="text-align: center;">
          <a href="${loginLink("/dashboard")}"
             style="background: #C8102E; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Get Started →
          </a>
        </div>
        <p style="color: #3A5A7A; font-size: 11px; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
          Honoring American Veterans — ournextproject.us
        </p>
      </div>
    `,
  });
}