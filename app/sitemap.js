export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://chinmaywellnessclub.in'
  const now = new Date()
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/#program`, lastModified: now, priority: 0.8 },
    { url: `${base}/#results`, lastModified: now, priority: 0.8 },
    { url: `${base}/#about`, lastModified: now, priority: 0.7 },
    { url: `${base}/#gallery`, lastModified: now, priority: 0.6 },
    { url: `${base}/#faq`, lastModified: now, priority: 0.6 },
  ]
}
