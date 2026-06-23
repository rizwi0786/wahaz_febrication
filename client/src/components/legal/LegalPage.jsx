import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Shared layout for static legal pages (Privacy Policy, Terms of Service).
// Keeps both pages visually consistent with the rest of the storefront.

export function LegalSection({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-xl md:text-2xl text-brand-primary mb-3">{title}</h2>
      <div className="space-y-3 text-sm md:text-[15px] leading-relaxed text-brand-muted">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ children }) {
  return <ul className="list-disc pl-5 space-y-1.5">{children}</ul>;
}

export default function LegalPage({ title, lastUpdated, intro, children }) {
  return (
    <div className="section py-8 max-w-3xl">
      <Link
        to="/"
        className="inline-flex items-center text-sm text-brand-muted hover:text-brand-primary mb-4"
      >
        <ArrowLeft size={14} className="mr-1" /> Back to home
      </Link>

      <h1 className="text-3xl md:text-4xl font-serif text-brand-primary mb-2">{title}</h1>
      <p className="text-xs text-brand-muted mb-6">Last updated: {lastUpdated}</p>

      {intro && (
        <p className="text-sm md:text-[15px] leading-relaxed text-brand-muted">{intro}</p>
      )}

      {children}
    </div>
  );
}
