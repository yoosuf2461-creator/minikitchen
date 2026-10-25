import HeroSection from '@/components/HeroSection';
import MenuSection from '@/components/MenuSection';
import ReservationSection from '@/components/ReservationSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#141414] text-[#f1f1f1] relative">
      <HeroSection />
      <MenuSection />
      <ReservationSection />
      <ContactSection />
      <Footer />
      <ChatWidget />
    </main>
  );
}
