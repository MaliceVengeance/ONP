import Link from "next/link";

export default function LegalPage() {
  return (
    <div style={{ padding: "60px 24px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "32px" }}>Legal</h1>
      <ul style={{ lineHeight: 2.5, fontSize: "18px" }}>
        <li><Link href="/terms">Terms of Service (Plain English)</Link></li>
        <li><Link href="/terms/legal">Terms of Service (Full Legal)</Link></li>
        <li><Link href="/privacy">Privacy Policy (Plain English)</Link></li>
        <li><Link href="/privacy/legal">Privacy Policy (Full Legal)</Link></li>
      </ul>
    </div>
  );
}
