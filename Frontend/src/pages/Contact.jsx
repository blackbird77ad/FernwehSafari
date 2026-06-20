import EnquiryForm from "../components/EnquiryForm";

export default function Contact() {
  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">Contact</p>
        <h1>Ask FernwehSafari before choosing your Tanzania or Zanzibar route.</h1>
      </section>
      <section className="section two-column">
        <div>
          <h2>FernwehSafari contact</h2>
          <p className="lead">
            Use the form for travel questions, custom route requests or tour listing enquiries.
          </p>
          <div className="contact-list">
            <a href="mailto:msamilashalom@gmail.com">msamilashalom@gmail.com</a>
            <a href="https://wa.me/4917676062927" target="_blank" rel="noreferrer">
              WhatsApp: +49 176 7606 2927
            </a>
            <a href="https://www.instagram.com/officialshalom2" target="_blank" rel="noreferrer">
              Instagram: @officialshalom2
            </a>
            <span>Tanzania and Zanzibar tour discovery for travellers planning from Europe.</span>
          </div>
        </div>
        <EnquiryForm />
      </section>
    </>
  );
}
