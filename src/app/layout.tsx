import type { Metadata } from 'next';
import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';

export const metadata: Metadata = {
  title: 'MiniKitchen | Artisanal Seasonal Dining & Table Reservations',
  description:
    'Experience intimate seasonal dining at MiniKitchen. Handcrafted pastas, open-flame braised cuts, curated cocktails, and easy online table reservations.',
  keywords: ['MiniKitchen', 'restaurant', 'reservations', 'fine dining', 'seasonal menu', 'artisanal kitchen'],
  authors: [{ name: 'MiniKitchen Culinary Team' }],
  openGraph: {
    title: 'MiniKitchen | Artisanal Seasonal Dining',
    description: 'Intimate dining with bold, locally sourced flavors. Reserve your table today.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Italiana&family=Pinyon+Script&family=Outfit:wght@200;300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#121110] text-[#f4efe6] antialiased selection:bg-[#d4a359]/30 selection:text-[#d4a359]">
        {/* Schema.org Structured Data for Local SEO & Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Restaurant',
              name: 'MiniKitchen',
              image: 'https://minikitchen.lk/images/hero.jpg',
              '@id': 'https://minikitchen.lk',
              url: 'https://minikitchen.lk',
              telephone: '+94 11 234 5678',
              priceRange: '$$$',
              menu: 'https://minikitchen.lk/#menu',
              servesCuisine: ['Artisanal', 'Seasonal', 'Open-Flame Hearth', 'Contemporary'],
              acceptsReservations: 'True',
              address: {
                '@type': 'PostalAddress',
                streetAddress: '142 Galle Road, Kollupitiya',
                addressLocality: 'Colombo',
                postalCode: '00300',
                addressCountry: 'LK',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 6.9147,
                longitude: 79.8517,
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                  opens: '18:00',
                  closes: '22:30',
                },
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Friday', 'Saturday', 'Sunday'],
                  opens: '12:00',
                  closes: '15:00',
                },
              ],
            }),
          }}
        />
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
