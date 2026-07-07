"use client";

export default function CouponInput() {
  return (
    <input
      type="text"
      placeholder="e.g. WELCOME3"
      style={{
        background: "#FFFFFF",
        border: "1px solid #d9dbdb",
        color: "var(--camo-charcoal)",
        borderRadius: "6px",
        padding: "10px 14px",
        fontFamily: "'Barlow', sans-serif",
        fontSize: "14px",
        outline: "none",
        width: "220px",
        textTransform: "uppercase",
      }}
      onChange={(e) => {
        const val = e.target.value.toUpperCase();
        document.querySelectorAll<HTMLInputElement>("input[name='coupon_code']").forEach(
          (el) => { el.value = val; }
        );
      }}
    />
  );
}
