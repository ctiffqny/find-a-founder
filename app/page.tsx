import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-page">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="landing-eyebrow">
            <span>USC VITERBI · TIE HUB</span>
            <span className="landing-beta">BETA</span>
          </div>

          <h1 className="landing-headline">
            GOOD IDEAS
            <br />
            NEED GREAT
            <br />
            PEOPLE<span className="landing-period">.</span>
          </h1>

          <div className="landing-hero-bottom">
            <p>
              Your next co-founder, teammate, or opportunity
              could be closer than you think.
            </p>

            <Link href="/get-started" className="landing-cta">
              Get Started <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <p className="landing-scroll-note">
            A community for people ready to build.
          </p>
        </div>
      </section>

      {/* Two paths */}
      <section className="landing-explore">
        <div className="landing-container">
          <div className="landing-section-intro">
            <span className="landing-section-label">
              01 / EXPLORE
            </span>

            <h2>Find what you're looking for.</h2>
          </div>

          <div className="landing-paths">
            <Link
              href="/founders"
              className="landing-path"
            >
              <span className="landing-path-number">01</span>

              <div>
                <h3>PEOPLE</h3>
                <p>
                  Meet founders, builders, and collaborators
                  across the USC community.
                </p>
              </div>

              <span
                className="landing-path-arrow"
                aria-hidden="true"
              >
                ↗
              </span>
            </Link>

            <Link
              href="/opportunities"
              className="landing-path"
            >
              <span className="landing-path-number">02</span>

              <div>
                <h3>OPPORTUNITIES</h3>
                <p>
                  Discover teams looking for co-founders,
                  talent, and fresh perspectives.
                </p>
              </div>

              <span
                className="landing-path-arrow"
                aria-hidden="true"
              >
                ↗
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-how">
        <div className="landing-container">
          <span className="landing-section-label">
            02 / HOW IT WORKS
          </span>

          <h2>
            THREE STEPS.
            <br />
            ENDLESS POSSIBILITIES.
          </h2>

          <div className="landing-steps">
            <article>
              <span>01 —</span>
              <h3>SHOW UP.</h3>
              <p>
                Create a profile and share who you are,
                what you do, and what you're looking for.
              </p>
            </article>

            <article>
              <span>02 —</span>
              <h3>LOOK AROUND.</h3>
              <p>
                Explore people and startup opportunities
                that match your interests.
              </p>
            </article>

            <article>
              <span>03 —</span>
              <h3>REACH OUT.</h3>
              <p>
                Send an introduction and start a
                conversation when there's mutual interest.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="landing-about">
        <div className="landing-container landing-about-grid">
          <div>
            <span className="landing-section-label">
              03 / ABOUT THE PLATFORM
            </span>

            <h2>BUILT AT USC.</h2>
          </div>

          <div className="landing-about-copy">
            <p>
              Find-a-Founder is developed by the{" "}
              <strong>
                William W. Wang Technology Innovation
                and Entrepreneurship Hub (TIE Hub)
              </strong>{" "}
              under the{" "}
              <strong>
                USC Viterbi School of Engineering
              </strong>.
            </p>

            <p>
              Built to bring USC's entrepreneurial
              community together, one connection
              at a time.
            </p>

            <a
              href="https://viterbiinnovation.usc.edu/"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-text-link"
            >
              Learn more about TIE Hub ↗
            </a>
          </div>
        </div>
      </section>

      {/* Beta notice */}
      <section className="landing-beta-section">
        <div className="landing-container landing-beta-row">
          <div>
            <span className="landing-section-label">
              CURRENTLY IN BETA
            </span>

            <h2>We're just getting started.</h2>
          </div>

          <p>
            Find-a-Founder is under active development.
            Features may change as we test and improve
            the platform with feedback from our community.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-final">
        <div className="landing-container">
          <h2>
            LET'S BUILD
            <br />
            SOMETHING.
          </h2>

          <Link href="/get-started" className="landing-cta">
            Join Find-a-Founder ↗
          </Link>

          <p>
            Sign up and complete your profile to
            explore the community.
          </p>
        </div>
      </section>
    </main>
  );
}
