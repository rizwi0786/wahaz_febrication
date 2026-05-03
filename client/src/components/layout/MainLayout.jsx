import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';

export default function MainLayout() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
