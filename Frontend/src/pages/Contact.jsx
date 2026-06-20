import EnquiryForm from "../components/EnquiryForm";

export default function Contact() {
  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">Contact</p>
        <h1>Ask FernwehSafari before choosing a partner route.</h1>
      </section>
      <section className="section two-column">
        <div>
          <h2>FernwehSafari contact</h2>
          <p className="lead">
            Use the form for general enquiries, partner questions or custom Tanzania and Zanzibar route requests.
          </p>
          <div className="contact-list">
            <a href="mailto:msamilashalom@gmail.com">msamilashalom@gmail.com</a>
            <a href="https://wa.me/4917676062927" target="_blank" rel="noreferrer">
              WhatsApp: +49 176 7606 2927
            </a>
            <a href="https://www.instagram.com/officialshalom2" target="_blank" rel="noreferrer">
              Instagram: @officialshalom2
            </a>
            <span>Europe-facing discovery, Tanzania and Zanzibar partner referrals.</span>
          </div>
        </div>
        <EnquiryForm />
      </section>
    </>
  );
}
