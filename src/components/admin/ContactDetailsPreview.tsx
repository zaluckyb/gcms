import React from 'react'

type PreviewProps = {
  data: Record<string, any>
}

const isUrl = (v?: string) => {
  if (!v) return false
  try {
    new URL(v)
    return true
  } catch {
    return false
  }
}

const ContactDetailsPreview: React.FC<PreviewProps> = ({ data }) => {
  const buildJsonLd = () => {
    try {
      const org = data.organization ?? {}
      const hq = data.hq ?? {}
      const persons = Array.isArray(data.persons) ? data.persons : []
      const webPage = data.webPage ?? {}
      const breadcrumb = data.breadcrumb ?? {}
      const faq = data.faq ?? {}
      const website = data.website ?? {}

      const json = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': org.orgId,
            name: org.name,
            url: org.url,
            logo: org.logo,
            email: org.email,
            telephone: org.telephone,
            areaServed: (org.areaServed ?? []).map((a: any) => ({ '@type': a.type, name: a.name })),
            sameAs: (org.sameAs ?? []).map((s: any) => s.url),
            contactPoint: (org.contactPoint ?? []).map((cp: any) => ({
              '@type': 'ContactPoint',
              contactType: cp.contactType,
              name: cp.name,
              telephone: cp.telephone,
              email: cp.email,
              availableLanguage: (cp.availableLanguage ?? []).map((l: any) => l.value),
              areaServed: cp.areaServed,
              hoursAvailable: cp.hoursAvailable?.dayOfWeek
                ? {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: cp.hoursAvailable.dayOfWeek,
                    opens: cp.hoursAvailable.opens,
                    closes: cp.hoursAvailable.closes,
                  }
                : undefined,
              url: cp.url,
            })),
            department: (org.department ?? []).map((d: any) => ({ '@id': d.id })),
          },
          {
            '@type': 'LocalBusiness',
            '@id': hq.hqId,
            name: hq.name,
            parentOrganization: { '@id': org.orgId },
            image: hq.image,
            telephone: hq.telephone,
            email: hq.email,
            address: hq.address?.streetAddress
              ? {
                  '@type': 'PostalAddress',
                  streetAddress: hq.address.streetAddress,
                  addressLocality: hq.address.addressLocality,
                  addressRegion: hq.address.addressRegion,
                  postalCode: hq.address.postalCode,
                  addressCountry: hq.address.addressCountry,
                }
              : undefined,
            geo: typeof hq.geo?.latitude === 'number' && typeof hq.geo?.longitude === 'number'
              ? { '@type': 'GeoCoordinates', latitude: hq.geo.latitude, longitude: hq.geo.longitude }
              : undefined,
            hasMap: hq.hasMap,
            openingHoursSpecification: (hq.openingHoursSpecification ?? []).map((oh: any) => ({
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: oh.dayOfWeek,
              opens: oh.opens,
              closes: oh.closes,
            })),
            publicAccess: !!hq.publicAccess,
            amenityFeature: (hq.amenityFeature ?? []).map((af: any) => ({
              '@type': 'LocationFeatureSpecification',
              name: af.name,
              value: !!af.value,
            })),
            areaServed: hq.areaServed?.geoRadius
              ? {
                  '@type': 'GeoCircle',
                  geoMidpoint: {
                    '@type': 'GeoCoordinates',
                    latitude: hq.areaServed.geoMidpoint?.latitude,
                    longitude: hq.areaServed.geoMidpoint?.longitude,
                  },
                  geoRadius: hq.areaServed.geoRadius,
                }
              : undefined,
            paymentAccepted: hq.paymentAccepted,
            currenciesAccepted: hq.currenciesAccepted,
            priceRange: hq.priceRange,
          },
          ...persons.map((p: any) => ({
            '@type': 'Person',
            '@id': p.personId,
            name: p.name,
            jobTitle: p.jobTitle,
            telephone: p.telephone,
            email: p.email,
            affiliation: { '@id': org.orgId },
          })),
          {
            '@type': ['WebPage', 'ContactPage'],
            '@id': webPage.webPageId,
            url: webPage.url,
            name: webPage.name,
            isPartOf: { '@id': org.orgId },
            about: { '@id': org.orgId },
            description: webPage.description,
            primaryImageOfPage: webPage.primaryImageOfPage,
            breadcrumb: { '@id': breadcrumb.breadcrumbId },
            potentialAction: (webPage.potentialAction ?? []).map((act: any) => {
              if (act.blockType === 'ContactAction') {
                return {
                  '@type': 'ContactAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: act.target.urlTemplate,
                    actionPlatform: act.target.actionPlatform,
                    inLanguage: act.target.inLanguage,
                  },
                }
              }
              return {
                '@type': 'CommunicateAction',
                name: act.name,
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: act.target.urlTemplate,
                  actionPlatform: act.target.actionPlatform,
                },
              }
            }),
            inLanguage: webPage.inLanguage,
          },
          {
            '@type': 'BreadcrumbList',
            '@id': breadcrumb.breadcrumbId,
            itemListElement: (breadcrumb.items ?? []).map((it: any) => ({
              '@type': 'ListItem',
              position: it.position,
              name: it.name,
              item: it.item,
            })),
          },
          {
            '@type': 'FAQPage',
            '@id': faq.faqId,
            mainEntity: (faq.mainEntity ?? []).map((q: any) => ({
              '@type': 'Question',
              name: q.name,
              acceptedAnswer: { '@type': 'Answer', text: q.acceptedAnswer },
            })),
          },
          {
            '@type': 'WebSite',
            '@id': website.websiteId,
            url: website.url,
            name: website.name,
            publisher: { '@id': org.orgId },
            sameAs: (website.sameAs ?? []).map((s: any) => s.url),
            inLanguage: website.inLanguage,
          },
        ],
      }

      return JSON.stringify(json, null, 2)
    } catch (e: any) {
      return `Error generating preview: ${e?.message ?? 'Unknown error'}`
    }
  }

  const json = buildJsonLd()

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-800">JSON-LD Preview</h3>
        <span className="text-xs text-gray-500">Read-only</span>
      </div>
      <pre className="mt-3 max-h-[400px] overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-900">
        {json}
      </pre>
      <p className="mt-2 text-xs text-gray-500">
        This preview mirrors the structure of `contact.md` and updates as you edit fields.
      </p>
    </div>
  )
}

export default ContactDetailsPreview