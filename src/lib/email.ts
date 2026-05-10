import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "ONP Notifications <notifications@ournextproject.us>";

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
          <a href="https://ournextproject.us/dashboard/client/projects/${projectId}/rfis" 
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
          <a href="https://ournextproject.us/dashboard/contractor/projects/${projectId}/rfis"
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
          <a href="https://ournextproject.us/dashboard/contractor/projects/${projectId}"
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
          <a href="https://ournextproject.us/dashboard/contractor/projects/${projectId}"
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
          <a href="https://ournextproject.us/dashboard/inspector/projects/${assignmentId}"
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