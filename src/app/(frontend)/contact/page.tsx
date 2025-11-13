import React from 'react'
import type { Metadata } from 'next'
import type { ContactDetail as ContactDetailsType } from '@/payload-types'
import { getPayload } from 'payload'
import config from '@/payload.config'

const API_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'

const getContactDetails = async (): Promise<ContactDetailsType | null> => {
  try {
    const payload = await getPayload({ config: await config })
    const result = await payload.find({ collection: 'contact-details', limit: 1, depth: 1 })
    return (result?.docs?.[0] ?? null) as ContactDetailsType | null
  } catch {
    return null
  }
}

export const generateMetadata = async (): Promise<Metadata> => {
  const doc = await getContactDetails()
  const title = doc?.webPage?.name ?? 'Contact WebDeveloper'
  const description = doc?.webPage?.description ?? 'Get in touch with WebDeveloper — modern web solutions, fast.'
  const url = `${API_URL}/contact`
  const image = doc?.webPage?.primaryImageOfPage ?? `${API_URL}/media/web-developer-2025.png`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

const JsonLd = ({ data }: { data: Record<string, unknown> }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
)

const formatTel = (tel?: string) => (tel ? tel.replace(/\s+/g, '') : '')

const ContactPage = async () => {
  const doc = await getContactDetails()

  if (!doc) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
        <p className="mt-4 text-neutral-600">Contact details are not available right now. Please try again later.</p>
      </main>
    )
  }

  const org = doc.organization
  const hq = doc.hq
  const webPage = doc.webPage
  const persons = doc.persons ?? []
  const contactPoints = org?.contactPoint ?? []

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': org?.orgId,
    name: org?.name,
    url: org?.url,
    logo: org?.logo,
    sameAs: (org?.sameAs ?? []).map((s) => s.url).filter(Boolean),
    contactPoint: contactPoints.map((cp) => ({
      '@type': 'ContactPoint',
      contactType: cp.contactType,
      name: cp.name,
      telephone: cp.telephone,
      email: cp.email,
      availableLanguage: (cp.availableLanguage ?? []).map((l) => l.value),
      areaServed: cp.areaServed,
      hoursAvailable: cp.hoursAvailable
        ? [{
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: cp.hoursAvailable.dayOfWeek,
            opens: cp.hoursAvailable.opens,
            closes: cp.hoursAvailable.closes,
          }]
        : [],
      url: cp.url,
    })),
    department: (org?.department ?? []).map((d) => ({ '@type': 'Organization', '@id': d.id })),
    areaServed: (org?.areaServed ?? []).map((a) => ({ '@type': a.type, name: a.name })),
  }

  const hqJsonLd = hq
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': hq.hqId,
        name: hq.name,
        image: hq.image,
        telephone: hq.telephone,
        email: hq.email,
        address: hq.address
          ? {
              '@type': 'PostalAddress',
              streetAddress: hq.address.streetAddress,
              addressLocality: hq.address.addressLocality,
              addressRegion: hq.address.addressRegion,
              postalCode: hq.address.postalCode,
              addressCountry: hq.address.addressCountry,
            }
          : undefined,
        geo: hq.geo
          ? { '@type': 'GeoCoordinates', latitude: hq.geo.latitude, longitude: hq.geo.longitude }
          : undefined,
        hasMap: hq.hasMap,
        openingHoursSpecification: (hq.openingHoursSpecification ?? []).map((o) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: o.dayOfWeek,
          opens: o.opens,
          closes: o.closes,
        })),
        publicAccess: hq.publicAccess,
        amenityFeature: (hq.amenityFeature ?? []).map((a) => ({ '@type': 'LocationFeatureSpecification', name: a.name, value: a.value })),
      }
    : null

  const breadcrumbJsonLd = doc.breadcrumb
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: (doc.breadcrumb.items ?? []).map((item) => ({
          '@type': 'ListItem',
          position: item.position,
          name: item.name,
          item: item.item,
        })),
      }
    : null

  const faqJsonLd = doc.faq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: (doc.faq.mainEntity ?? []).map((q) => ({
          '@type': 'Question',
          name: q.name,
          acceptedAnswer: { '@type': 'Answer', text: q.acceptedAnswer },
        })),
      }
    : null

  const webpageJsonLd = webPage
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': webPage.webPageId,
        url: webPage.url,
        name: webPage.name,
        description: webPage.description,
        primaryImageOfPage: webPage.primaryImageOfPage,
        inLanguage: webPage.inLanguage,
        potentialAction: (webPage.potentialAction ?? []).flatMap((pa) => (pa.actions ?? []).map((action) => ({
          '@type': action.blockType === 'CommunicateAction' ? 'CommunicateAction' : 'ContactAction',
          name: 'name' in action ? action.name : undefined,
          target: action.target
            ? {
                '@type': 'EntryPoint',
                urlTemplate: action.target.urlTemplate,
                actionPlatform: action.target.actionPlatform,
                ...( 'inLanguage' in action.target
                  ? { inLanguage: (action.target as { inLanguage?: string }).inLanguage }
                  : {} ),
              }
            : undefined,
        }))),
      }
    : null

  return (
    <main className="mx-auto max-w-7xl px-4 py-16">
      {/* JSON-LD SEO */}
      <JsonLd data={orgJsonLd} />
      {hqJsonLd && <JsonLd data={hqJsonLd} />}
      {breadcrumbJsonLd && <JsonLd data={breadcrumbJsonLd} />}
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      {webpageJsonLd && <JsonLd data={webpageJsonLd} />}

      {/* Hero */}
      <section aria-labelledby="contact-title" className="text-center">
        <h1 id="contact-title" className="text-4xl font-bold tracking-tight text-white">
          {webPage?.name ?? 'Contact WebDeveloper'}
        </h1>
        <p className="mt-4 text-neutral-300 leading-relaxed">
          {webPage?.description ?? 'Talk to us about modern, fast, and accessible web solutions.'}
        </p>
      </section>

      {/* Contact Options */}
      <section className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3" aria-label="Primary contact options">
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Call us</h2>
          <p className="mt-2 text-neutral-700 leading-relaxed">Speak to a specialist now.</p>
          {org?.telephone && (
            <a
              className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-white"
              href={`tel:${formatTel(org.telephone)}`}
            >
              {org.telephone}
            </a>
          )}
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Email us</h2>
          <p className="mt-2 text-neutral-700 leading-relaxed">We reply within one business day.</p>
          {org?.email && (
            <a
              className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-white"
              href={`mailto:${org.email}`}
            >
              {org.email}
            </a>
          )}
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Visit HQ</h2>
          <p className="mt-2 text-neutral-700 leading-relaxed">Come say hi at our office.</p>
          {hq?.hasMap && (
            <a
              className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-white"
              href={hq.hasMap}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Map
            </a>
          )}
        </div>
      </section>

      {/* Address & Hours */}
      <section className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2" aria-label="Location and hours">
        <div>
          <h2 className="text-xl font-semibold text-white">Head Office</h2>
          <address className="mt-4 not-italic text-neutral-300">
            {hq?.address?.streetAddress && <div>{hq.address.streetAddress}</div>}
            {hq?.address?.addressLocality && <div>{hq.address.addressLocality}</div>}
            {hq?.address?.addressRegion && <div>{hq.address.addressRegion}</div>}
            {hq?.address?.postalCode && <div>{hq.address.postalCode}</div>}
            {hq?.address?.addressCountry && <div>{hq.address.addressCountry}</div>}
          </address>
          {hq?.telephone && (
            <div className="mt-3">
              <a className="text-white underline hover:text-emerald-300 break-words" href={`tel:${formatTel(hq.telephone)}`}>{hq.telephone}</a>
            </div>
          )}
          {hq?.email && (
            <div className="mt-2">
              <a className="text-white underline hover:text-emerald-300 break-words" href={`mailto:${hq.email}`}>{hq.email}</a>
            </div>
          )}
          {org?.sameAs?.length ? (
            <ul className="mt-4 flex flex-wrap gap-3" aria-label="Social links">
              {org.sameAs.map((s, i) => (
                <li key={i}>
                  <a
                    className="text-neutral-300 underline hover:text-white break-words"
                    href={s.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.url ? new URL(s.url).hostname : 'External link'}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white">Opening Hours</h2>
          <ul className="mt-4 space-y-2">
            {(hq?.openingHoursSpecification ?? []).map((o, i) => (
              <li key={`${o.dayOfWeek}-${i}`} className="flex items-center justify-between text-neutral-300">
                <span>{o.dayOfWeek}</span>
                <span>{o.opens} – {o.closes}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact Points */}
      {contactPoints.length > 0 && (
        <section className="mt-16" aria-label="Contact points">
          <h2 className="text-xl font-semibold text-white">Departments</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {contactPoints.map((cp, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-neutral-900">{cp.contactType}</div>
                    {cp.name && <div className="text-neutral-600">{cp.name}</div>}
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-neutral-700">
                  {cp.telephone && (
                    <div>
                      <span className="font-medium">Tel:</span>{' '}
                      <a className="underline break-words text-neutral-900 hover:text-emerald-700" href={`tel:${formatTel(cp.telephone)}`}>{cp.telephone}</a>
                    </div>
                  )}
                  {cp.email && (
                    <div>
                      <span className="font-medium">Email:</span>{' '}
                      <a className="underline break-words text-neutral-900 hover:text-emerald-700" href={`mailto:${cp.email}`}>{cp.email}</a>
                    </div>
                  )}
                  {cp.url && (
                    <div>
                      <span className="font-medium">Page:</span>{' '}
                      <a className="underline break-words text-neutral-900 hover:text-emerald-700" href={cp.url} target="_blank" rel="noopener noreferrer">{cp.url}</a>
                    </div>
                  )}
                  {cp.availableLanguage?.length ? (
                    <div>
                      <span className="font-medium">Languages:</span>{' '}
                      {(cp.availableLanguage ?? []).map((l) => l.value).join(', ')}
                    </div>
                  ) : null}
                  {cp.hoursAvailable && (
                    <div>
                      <span className="font-medium">Hours:</span>{' '}
                      {cp.hoursAvailable.dayOfWeek} {cp.hoursAvailable.opens}–{cp.hoursAvailable.closes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Team */}
      {persons.length > 0 && (
        <section className="mt-16" aria-label="Team contacts">
          <h2 className="text-xl font-semibold text-white">Talk to the team</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {persons.map((p, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="text-lg font-semibold text-neutral-900">{p.name}</div>
                <div className="text-neutral-600">{p.jobTitle}</div>
                <div className="mt-3 space-y-2 text-neutral-700">
                  <div>
                    <span className="font-medium">Tel:</span>{' '}
                    <a className="underline break-words text-neutral-900 hover:text-emerald-700" href={`tel:${formatTel(p.telephone)}`}>{p.telephone}</a>
                  </div>
                  {p.email && (
                    <div>
                      <span className="font-medium">Email:</span>{' '}
                      <a className="underline break-words text-neutral-900 hover:text-emerald-700" href={`mailto:${p.email}`}>{p.email}</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {doc.faq?.mainEntity?.length ? (
        <section className="mt-16" aria-label="Frequently asked questions">
          <h2 className="text-xl font-semibold text-white">FAQs</h2>
          <div className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {doc.faq.mainEntity.map((q, i) => (
              <details key={i} className="group p-6">
                <summary className="cursor-pointer text-lg font-semibold text-neutral-900">
                  {q.name}
                </summary>
                <div className="mt-3 text-neutral-700 leading-relaxed">
                  {q.acceptedAnswer}
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default ContactPage