import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Chinmay Wellness Club | वजन नहीं, जीवनशैली बदलिए — Kolhapur',
  description:
    'Chinmay Wellness Club, Kolhapur — Dr. Chandrashekhar Harale यांचे वैयक्तिक wellness coaching. No gym, no starving. Sustainable, personalised Indian nutrition & daily personal guidance.',
  keywords:
    'wellness coach Kolhapur, weight loss Kolhapur, Chinmay Wellness Club, Dr Chandrashekhar Harale, Indian diet plan, lifestyle coaching Maharashtra',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://chinmaywellnessclub.in'),
  openGraph: {
    title: 'Chinmay Wellness Club — Kolhapur',
    description: 'Sustainable wellness coaching with daily personal guidance from Dr. Chandrashekhar Harale.',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export const viewport = {
  themeColor: '#0F6B4C',
  width: 'device-width',
  initialScale: 1,
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HealthAndBeautyBusiness',
  name: 'Chinmay Wellness Club',
  image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
  '@id': 'https://chinmaywellnessclub.in',
  url: 'https://chinmaywellnessclub.in',
  telephone: '+919975727098',
  founder: { '@type': 'Person', name: 'Dr. Chandrashekhar Harale' },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Kolhapur',
    addressRegion: 'Maharashtra',
    addressCountry: 'IN',
  },
  areaServed: 'Kolhapur, Maharashtra',
  description: 'Personal wellness & lifestyle coaching in Kolhapur.',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '100',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🌿%3C/text%3E%3C/svg%3E" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
