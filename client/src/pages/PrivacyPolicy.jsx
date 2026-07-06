import LegalPage, { LegalSection, LegalList } from '../components/legal/LegalPage';
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from '../config/contact';

const LAST_UPDATED = '23 June 2026';

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          At Bellissimo Couture (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), we
          respect your privacy and are committed to protecting the personal information you share
          with us. This Privacy Policy explains what information we collect when you visit or make a
          purchase from our website, how we use it, and the choices you have.
        </>
      }
    >
      <LegalSection title="1. Information We Collect">
        <p>We collect the following types of information:</p>
        <LegalList>
          <li>
            <strong>Information you provide</strong> — name, email address, phone number, shipping
            and billing addresses, and order details when you create an account, place an order, or
            request a custom design or consultation.
          </li>
          <li>
            <strong>Payment information</strong> — payments are processed by our third-party payment
            providers. We do not store your full card or banking details on our servers.
          </li>
          <li>
            <strong>Information collected automatically</strong> — device and browser type, IP
            address, pages visited, and similar usage data gathered through cookies and analytics.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <LegalList>
          <li>To process, fulfil, and deliver your orders and custom requests.</li>
          <li>To communicate with you about your orders, enquiries, and consultations.</li>
          <li>To send you marketing updates and offers, where you have opted in.</li>
          <li>To improve our products, website, and customer experience.</li>
          <li>To detect, prevent, and address fraud or technical issues.</li>
          <li>To comply with our legal and regulatory obligations.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Sharing Your Information">
        <p>
          We do not sell your personal information. We share it only with trusted parties who help
          us operate our business, such as:
        </p>
        <LegalList>
          <li>Payment gateways and processors to complete transactions.</li>
          <li>Shipping and logistics partners to deliver your orders.</li>
          <li>Service providers for hosting, analytics, and customer support.</li>
          <li>Authorities or legal bodies where required by law.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Cookies & Tracking">
        <p>
          We use cookies and similar technologies to keep you signed in, remember items in your
          cart, understand how our site is used, and improve your experience. You can control or
          disable cookies through your browser settings, though some features may not work as
          intended without them.
        </p>
      </LegalSection>

      <LegalSection title="5. Data Security">
        <p>
          We use reasonable administrative, technical, and physical safeguards to protect your
          personal information. However, no method of transmission over the internet or electronic
          storage is fully secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="6. Data Retention">
        <p>
          We retain your personal information for as long as your account is active or as needed to
          provide our services, comply with legal obligations, resolve disputes, and enforce our
          agreements.
        </p>
      </LegalSection>

      <LegalSection title="7. Your Rights">
        <p>Subject to applicable law, you may have the right to:</p>
        <LegalList>
          <li>Access the personal information we hold about you.</li>
          <li>Request correction of inaccurate or incomplete information.</li>
          <li>Request deletion of your personal information.</li>
          <li>Opt out of marketing communications at any time.</li>
        </LegalList>
        <p>To exercise any of these rights, please contact us using the details below.</p>
      </LegalSection>

      <LegalSection title="8. Children's Privacy">
        <p>
          Our website is not directed to individuals under the age of 18, and we do not knowingly
          collect personal information from children.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Any changes will be posted on this
          page with an updated &ldquo;Last updated&rdquo; date.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact Us">
        <p>
          If you have any questions about this Privacy Policy or how we handle your information,
          please reach out to us:
        </p>
        <LegalList>
          <li>
            Email:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-secondary hover:underline">
              {CONTACT_EMAIL}
            </a>
          </li>
          <li>Phone: {CONTACT_PHONE_DISPLAY}</li>
          <li>Bellissimo Couture, WZ-210, Shakurpur Village, New Delhi 110034, India</li>
        </LegalList>
      </LegalSection>
    </LegalPage>
  );
}
