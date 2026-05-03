const WHATSAPP_NUMBER = '917217788633';
const DEFAULT_MSG = "Hi Bellissimo Couture, I'd like to know more about your products.";

// Official WhatsApp glyph (white logo on green disc)
function WhatsAppIcon({ size = 28 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.252-.832-2.508-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.295v.13c-.015.99.472 1.977 1.017 2.79 1.23 1.82 2.355 3.41 4.337 4.495.616.343 2.59 1.234 3.282 1.234.817 0 2.553-.4 2.943-1.49.247-.687.183-1.346-.063-1.418-.348-.115-2.395-1.1-2.683-1.085M16.16 27.205h-.043c-2.52 0-4.973-.59-7.18-1.85l-.515-.305-5.31 1.39 1.42-5.18-.336-.534a13.9 13.9 0 0 1-2.13-7.4c0-7.667 6.234-13.9 13.9-13.9 7.668 0 13.901 6.234 13.901 13.901 0 7.667-6.232 13.9-13.9 13.9m-.013-25.156c-6.39 0-11.985 5.235-11.985 11.625 0 2.27.8 4.45 2.05 6.265l-1.69 6.165 6.32-1.66a13.85 13.85 0 0 0 5.624 1.456h.043c6.39 0 11.616-5.595 11.616-11.985 0-3.085-1.235-5.985-3.42-8.165a11.62 11.62 0 0 0-8.158-3.4z" />
    </svg>
  );
}

export default function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MSG)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2"
    >
      <span className="hidden sm:inline-flex bg-white text-brand-primary text-sm font-medium px-3 py-2 rounded-full shadow-md">
        Chat with us
      </span>
      <span className="bg-[#25D366] text-white rounded-full shadow-lg p-3 transition-transform duration-200 group-hover:scale-105">
        <WhatsAppIcon size={28} />
      </span>
    </a>
  );
}
