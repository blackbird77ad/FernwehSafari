import { useState } from "react";

const faqGroups = [
  {
    category: "Visas & Safety",
    items: [
      ["Do I need a visa for Tanzania?", "Many travellers need a visa or eVisa before arrival. Always confirm the current rule for your passport before booking flights."],
      ["Is safari travel safe?", "Work with reviewed operators, follow guide instructions and avoid self-planning remote routes without local support."],
      ["Can I visit Zanzibar and mainland Tanzania in one trip?", "Yes. Many routes combine safari or Kilimanjaro with Stone Town, beaches, Jozani or Mnemba."]
    ]
  },
  {
    category: "Booking & Refunds",
    items: [
      ["Does FernwehSafari take payment?", "FernwehSafari helps discovery and referral handoff. Booking and payment happen through the original tour operator flow."],
      ["Who confirms availability?", "The tour operator confirms live availability, inclusions, terms and payment details."],
      ["Can I ask questions before booking?", "Yes. Use the contact form or tour enquiry flow with dates, group size and destination priorities."]
    ]
  },
  {
    category: "Packing Guides",
    items: [
      ["What should I pack for safari?", "Neutral clothing, sun protection, closed shoes, a light layer, camera batteries and any personal medication."],
      ["What should I pack for Zanzibar?", "Light clothing, reef-safe sunscreen, sandals, modest cover-ups for Stone Town and swimwear for beach days."],
      ["What about Kilimanjaro?", "Layering matters. Use operator guidance for boots, thermals, waterproof shell, gloves and altitude-ready gear."]
    ]
  }
];

export default function FAQ() {
  const [openKey, setOpenKey] = useState("");

  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">FAQ</p>
        <h1>Fast answers before you choose a route.</h1>
      </section>
      <section className="section faq-groups">
        {faqGroups.map((group) => (
          <div className="faq-group" key={group.category}>
            <h2>{group.category}</h2>
            <div className="accordion">
              {group.items.map(([question, answer]) => {
                const key = `${group.category}-${question}`;
                const open = openKey === key;
                return (
                  <article key={key}>
                    <button type="button" onClick={() => setOpenKey(open ? "" : key)}>
                      <span>{question}</span>
                      <strong>{open ? "-" : "+"}</strong>
                    </button>
                    {open && <p>{answer}</p>}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
