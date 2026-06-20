import { useState } from "react";
import { faqs } from "../utils/staticContent";

export default function FAQ() {
  const [openQuestion, setOpenQuestion] = useState(faqs[0].question);

  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">FAQ</p>
        <h1>Referral process, payments and partner handoff.</h1>
      </section>
      <section className="section narrow">
        <div className="accordion">
          {faqs.map((item) => {
            const open = openQuestion === item.question;
            return (
              <article key={item.question}>
                <button type="button" onClick={() => setOpenQuestion(open ? "" : item.question)}>
                  <span>{item.question}</span>
                  <strong>{open ? "-" : "+"}</strong>
                </button>
                {open && <p>{item.answer}</p>}
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
