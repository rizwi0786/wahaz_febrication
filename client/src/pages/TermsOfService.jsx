import LegalPage, { LegalSection, LegalList } from '../components/legal/LegalPage';
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from '../config/contact';

const LAST_UPDATED = '23 June 2026';

export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          Welcome to Bellissimo Couture. These Terms of Service (&ldquo;Terms&rdquo;) govern your
          use of our website and your purchase of our products and services. By accessing our
          website or placing an order, you agree to be bound by these Terms. Please read them
          carefully.
        </>
      }
    >
      <LegalSection title="1. Acceptance of Terms">
        <p>
          By using this website, creating an account, or placing an order, you confirm that you are
          at least 18 years old and agree to comply with these Terms and all applicable laws. If you
          do not agree, please do not use our website.
        </p>
      </LegalSection>

      <LegalSection title="2. Your Account">
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activity that occurs under your account. Please notify us immediately of any
          unauthorised use. We reserve the right to suspend or terminate accounts that violate these
          Terms.
        </p>
      </LegalSection>

      <LegalSection title="3. Products, Pricing & Availability">
        <LegalList>
          <li>
            We make every effort to display product details, colours, and images as accurately as
            possible, though slight variations may occur.
          </li>
          <li>
            All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes
            unless stated otherwise.
          </li>
          <li>
            Prices and availability are subject to change without notice, and we reserve the right
            to correct any errors or limit quantities.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Orders & Payment">
        <p>
          Placing an order constitutes an offer to purchase. We reserve the right to accept or
          decline any order. An order is confirmed once payment is received and we send you a
          confirmation. Payments are handled securely through our authorised payment partners.
        </p>
      </LegalSection>

      <LegalSection title="5. Shipping & Delivery">
        <p>
          We aim to dispatch and deliver orders within the estimated timelines shown at checkout.
          Delivery times are estimates and may vary due to factors beyond our control. Risk of loss
          passes to you once the order is delivered to the address you provide.
        </p>
      </LegalSection>

      <LegalSection title="6. Returns, Exchanges & Refunds">
        <LegalList>
          <li>
            Eligible items may be returned or exchanged within the return window communicated at the
            time of purchase, provided they are unused, unwashed, and in their original condition
            and packaging with tags intact.
          </li>
          <li>
            Custom-made and made-to-order items may not be eligible for return or exchange except in
            the case of a manufacturing defect.
          </li>
          <li>
            Approved refunds are processed to the original payment method within a reasonable
            period.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="7. Custom Orders & Consultations">
        <p>
          Custom designs, alterations, and consultation sessions are subject to the specifications
          agreed between you and our team. Timelines, pricing, and final details will be confirmed
          before work begins. As these items are made to your requirements, they are generally
          non-refundable once production has started.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual Property">
        <p>
          All content on this website — including the Bellissimo Couture name, logo, designs, text,
          graphics, and images — is the property of Bellissimo Couture or its licensors and is
          protected by applicable intellectual property laws. You may not copy, reproduce, or use
          any content without our prior written permission.
        </p>
      </LegalSection>

      <LegalSection title="9. Acceptable Use">
        <p>You agree not to:</p>
        <LegalList>
          <li>Use the website for any unlawful or fraudulent purpose.</li>
          <li>Interfere with or disrupt the website's security or functionality.</li>
          <li>Attempt to gain unauthorised access to our systems or other users' accounts.</li>
          <li>Reproduce or resell any part of the website without authorisation.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Bellissimo Couture shall not be liable for any
          indirect, incidental, or consequential damages arising from your use of the website or
          products. Our total liability for any claim shall not exceed the amount you paid for the
          relevant order.
        </p>
      </LegalSection>

      <LegalSection title="11. Governing Law">
        <p>
          These Terms are governed by the laws of India. Any disputes arising out of or relating to
          these Terms shall be subject to the exclusive jurisdiction of the courts of New Delhi,
          India.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to These Terms">
        <p>
          We may update these Terms from time to time. Changes take effect once posted on this page
          with an updated &ldquo;Last updated&rdquo; date. Your continued use of the website
          constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact Us">
        <p>If you have any questions about these Terms, please contact us:</p>
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
