import Link from "next/link";

const services = [
  {
    number: "01",
    title: "Digital Catalogues",
    description:
      "Turn your products into a clean, shareable catalogue designed for customers.",
  },
  {
    number: "02",
    title: "Business Websites",
    description:
      "Professional websites that give your business a real digital home.",
  },
  {
    number: "03",
    title: "Online Shops",
    description:
      "Bring your products online and make it easier for customers to discover and order.",
  },
  {
    number: "04",
    title: "Business Software",
    description:
      "Custom digital tools built around the way your business actually works.",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="site-nav">
        <Link href="/" className="brand">
          BKM<span>DIGITAL</span>
        </Link>

        <div className="nav-links">
          <a href="#services">Services</a>
          <a href="#work">Our Work</a>
          <a href="#contact">Contact</a>
        </div>

        <a href="#contact" className="nav-button">
          Start a Project
        </a>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">DIGITAL PRODUCTS FOR MODERN BUSINESS</p>

          <h1>
            Build your business
            <br />
            <span>for the digital world.</span>
          </h1>

          <p className="hero-description">
            BKM DIGITAL creates practical digital products that help businesses
            look better, sell better and work smarter.
          </p>

          <div className="hero-actions">
            <a href="#contact" className="primary-button">
              Start a Project →
            </a>
            <a href="#services" className="secondary-button">
              Explore Services
            </a>
          </div>
        </div>

        <div className="hero-mark">
          <div className="mark-inner">BKM</div>
        </div>
      </section>

      <section id="services" className="services-section">
        <div className="section-heading">
          <p className="eyebrow">WHAT WE BUILD</p>
          <h2>Digital tools with a purpose.</h2>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <article className="service-card" key={service.number}>
              <span className="service-number">{service.number}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <span className="card-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section id="work" className="work-section">
        <div>
          <p className="eyebrow">THE SHOWCASE</p>
          <h2>From idea to digital product.</h2>
        </div>

        <p>
          Yobby Kicks is one of our early projects — demonstrating how BKM
          DIGITAL can turn a real business into a stronger digital experience.
        </p>
      </section>

      <section id="contact" className="contact-section">
        <p className="eyebrow">LET&apos;S BUILD</p>
        <h2>Have an idea?</h2>
        <p>
          Tell us what you&apos;re trying to build. We&apos;ll turn the idea
          into a practical digital product.
        </p>
        <a href="mailto:hello@bkmdigital.co.ke" className="primary-button">
          Talk to BKM DIGITAL →
        </a>
      </section>

      <footer>
        <div className="brand">
          BKM<span>DIGITAL</span>
        </div>
        <p>© 2026 BKM DIGITAL. Digital products for modern business.</p>
      </footer>
    </main>
  );
}
