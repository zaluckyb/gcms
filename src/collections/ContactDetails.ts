import type { CollectionConfig } from 'payload'

type MaybeManyString = string | string[] | null | undefined
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string')

const phoneValidate = (val: MaybeManyString) => {
  if (isStringArray(val)) {
    const allValid = val.every((t) => /^\+?[0-9\s\-()]{7,20}$/.test(t))
    return allValid || 'Use international format, e.g. +27 87 265 2465'
  }
  if (!val) return 'Telephone is required'
  const ok = /^\+?[0-9\s\-()]{7,20}$/.test(val)
  return ok || 'Use international format, e.g. +27 87 265 2465'
}

const urlValidate = (val: MaybeManyString) => {
  if (isStringArray(val)) {
    try {
      val.forEach((v) => new URL(v))
      return true
    } catch {
      return 'Enter a valid URL'
    }
  }
  if (!val) return true
  try {
    new URL(val)
    return true
  } catch {
    return 'Enter a valid URL'
  }
}

const emailValidate = (val: MaybeManyString) => {
  if (isStringArray(val)) {
    const allValid = val.every((e) => /^\S+@\S+\.\S+$/.test(e))
    return allValid || 'Enter a valid email address'
  }
  if (!val) return 'Email is required'
  const ok = /^\S+@\S+\.\S+$/.test(val)
  return ok || 'Enter a valid email address'
}

export const ContactDetails: CollectionConfig = {
  slug: 'contact-details',
  labels: { singular: 'Contact Details', plural: 'Contact Details' },
  admin: {
    useAsTitle: 'title',
    description:
      'Manage Contact Details in a structure compatible with .trae/documents/contact.md JSON-LD',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    { type: 'text', name: 'title', label: 'Title', required: true, admin: { description: 'Used as the admin title. Recommend matching Organization name.' } },
    {
      type: 'ui',
      name: 'jsonPreview',
      admin: {
        position: 'sidebar',
        // Use alias path so Payload import map resolves correctly
        components: { Field: '@/components/admin/ContactDetailsPreview' },
      },
    },
    {
      type: 'group',
      name: 'organization',
      label: 'Organization',
      fields: [
        { type: 'text', name: 'orgId', label: '@id', required: true },
        { type: 'text', name: 'name', label: 'Name', required: true },
        { type: 'text', name: 'url', label: 'URL', required: true, validate: urlValidate },
        { type: 'text', name: 'logo', label: 'Logo URL', validate: urlValidate },
        { type: 'email', name: 'email', label: 'Email', required: true, validate: emailValidate },
        { type: 'text', name: 'telephone', label: 'Telephone', required: true, validate: phoneValidate },
        {
          type: 'array',
          name: 'areaServed',
          label: 'Area Served',
          labels: { singular: 'Area', plural: 'Areas' },
          fields: [
            {
              type: 'select',
              name: 'type',
              label: '@type',
              options: [
                { label: 'Country', value: 'Country' },
                { label: 'City', value: 'City' },
              ],
              required: true,
            },
            { type: 'text', name: 'name', label: 'Name', required: true },
          ],
        },
        {
          type: 'array',
          name: 'sameAs',
          label: 'Same As (URLs)',
          fields: [{ type: 'text', name: 'url', label: 'URL', validate: urlValidate }],
        },
        {
          type: 'array',
          name: 'contactPoint',
          label: 'Contact Points',
          fields: [
            { type: 'text', name: 'contactType', label: 'Contact Type', required: true },
            { type: 'text', name: 'name', label: 'Name' },
            { type: 'text', name: 'telephone', label: 'Telephone', required: true, validate: phoneValidate },
            { type: 'email', name: 'email', label: 'Email', validate: emailValidate },
            {
              type: 'array',
              name: 'availableLanguage',
              label: 'Available Languages',
              fields: [{ type: 'text', name: 'value', label: 'Language Code', required: true }],
            },
            { type: 'text', name: 'areaServed', label: 'Area Served (code)' },
            {
              type: 'group',
              name: 'hoursAvailable',
              label: 'Hours Available',
              fields: [
                {
                  type: 'select',
                  name: 'dayOfWeek',
                  label: 'Day Of Week',
                  // Shorten enum identifier to avoid 63-char Postgres limit
                  dbName: 'org_cp_hours_day',
                  options: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                  ].map((d) => ({ label: d, value: d })),
                },
                { type: 'text', name: 'opens', label: 'Opens (HH:mm)' },
                { type: 'text', name: 'closes', label: 'Closes (HH:mm)' },
              ],
            },
            { type: 'text', name: 'url', label: 'URL', validate: urlValidate },
          ],
        },
        {
          type: 'array',
          name: 'department',
          label: 'Department IDs',
          fields: [{ type: 'text', name: 'id', label: '@id', required: true }],
        },
      ],
    },
    {
      type: 'group',
      name: 'hq',
      label: 'Head Office (LocalBusiness)',
      fields: [
        { type: 'text', name: 'hqId', label: '@id', required: true },
        { type: 'text', name: 'name', label: 'Name', required: true },
        { type: 'text', name: 'image', label: 'Image URL', validate: urlValidate },
        { type: 'text', name: 'telephone', label: 'Telephone', required: true, validate: phoneValidate },
        { type: 'email', name: 'email', label: 'Email', validate: emailValidate },
        {
          type: 'group',
          name: 'address',
          label: 'Address',
          fields: [
            { type: 'text', name: 'streetAddress', label: 'Street Address', required: true },
            { type: 'text', name: 'addressLocality', label: 'City', required: true },
            { type: 'text', name: 'addressRegion', label: 'Region/Province', required: true },
            { type: 'text', name: 'postalCode', label: 'Postal Code', required: true },
            { type: 'text', name: 'addressCountry', label: 'Country Code', required: true },
          ],
        },
        {
          type: 'group',
          name: 'geo',
          label: 'Geo Coordinates',
          fields: [
            { type: 'number', name: 'latitude', label: 'Latitude', required: true },
            { type: 'number', name: 'longitude', label: 'Longitude', required: true },
          ],
        },
        { type: 'text', name: 'hasMap', label: 'Map URL', validate: urlValidate },
        {
          type: 'array',
          name: 'openingHoursSpecification',
          label: 'Opening Hours',
          fields: [
            {
              type: 'select',
              name: 'dayOfWeek',
              label: 'Day Of Week',
              // Shorten enum identifier for HQ opening hours
              dbName: 'hq_hours_day',
              options: [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
              ].map((d) => ({ label: d, value: d })),
            },
            { type: 'text', name: 'opens', label: 'Opens (HH:mm)' },
            { type: 'text', name: 'closes', label: 'Closes (HH:mm)' },
          ],
        },
        { type: 'checkbox', name: 'publicAccess', label: 'Public Access' },
        {
          type: 'array',
          name: 'amenityFeature',
          label: 'Amenity Features',
          fields: [
            { type: 'text', name: 'name', label: 'Name', required: true },
            { type: 'checkbox', name: 'value', label: 'Value' },
          ],
        },
        {
          type: 'group',
          name: 'areaServed',
          label: 'Area Served (GeoCircle)',
          fields: [
            {
              type: 'group',
              name: 'geoMidpoint',
              label: 'Geo Midpoint',
              fields: [
                { type: 'number', name: 'latitude', label: 'Latitude', required: true },
                { type: 'number', name: 'longitude', label: 'Longitude', required: true },
              ],
            },
            { type: 'number', name: 'geoRadius', label: 'Geo Radius (meters)', required: true },
          ],
        },
        { type: 'text', name: 'paymentAccepted', label: 'Payment Accepted' },
        { type: 'text', name: 'currenciesAccepted', label: 'Currencies Accepted' },
        { type: 'text', name: 'priceRange', label: 'Price Range' },
      ],
    },
    {
      type: 'array',
      name: 'persons',
      label: 'Contacts (Persons)',
      labels: { singular: 'Person', plural: 'Persons' },
      fields: [
        { type: 'text', name: 'personId', label: '@id', required: true },
        { type: 'text', name: 'name', label: 'Name', required: true },
        { type: 'text', name: 'jobTitle', label: 'Job Title', required: true },
        { type: 'text', name: 'telephone', label: 'Telephone', required: true, validate: phoneValidate },
        { type: 'email', name: 'email', label: 'Email', validate: emailValidate },
      ],
    },
    {
      type: 'group',
      name: 'webPage',
      label: 'WebPage (Contact)',
      fields: [
        { type: 'text', name: 'webPageId', label: '@id', required: true },
        { type: 'text', name: 'url', label: 'URL', required: true, validate: urlValidate },
        { type: 'text', name: 'name', label: 'Name', required: true },
        { type: 'text', name: 'description', label: 'Description', required: true },
        { type: 'text', name: 'primaryImageOfPage', label: 'Primary Image URL', validate: urlValidate },
        {
          type: 'array',
          name: 'potentialAction',
          label: 'Potential Actions',
          admin: { initCollapsed: true },
          fields: [
            {
              type: 'blocks',
              name: 'actions',
              blocks: [
                {
                  slug: 'ContactAction',
                  fields: [
                    {
                      type: 'group',
                      name: 'target',
                      label: 'Target (EntryPoint)',
                      fields: [
                        { type: 'text', name: 'urlTemplate', label: 'URL Template', validate: urlValidate },
                        {
                          type: 'select',
                          name: 'actionPlatform',
                          label: 'Action Platform',
                          // Shorten enum identifier
                          dbName: 'action_platform',
                          options: [
                            'http://schema.org/DesktopWebPlatform',
                            'http://schema.org/MobileWebPlatform',
                          ].map((d) => ({ label: d, value: d })),
                        },
                        { type: 'text', name: 'inLanguage', label: 'Language' },
                      ],
                    },
                  ],
                },
                {
                  slug: 'CommunicateAction',
                  fields: [
                    { type: 'text', name: 'name', label: 'Name' },
                    {
                      type: 'group',
                      name: 'target',
                      label: 'Target (EntryPoint)',
                      fields: [
                        { type: 'text', name: 'urlTemplate', label: 'URL Template', validate: urlValidate },
                        {
                          type: 'select',
                          name: 'actionPlatform',
                          label: 'Action Platform',
                          dbName: 'action_platform',
                          options: [
                            'http://schema.org/DesktopWebPlatform',
                            'http://schema.org/MobileWebPlatform',
                          ].map((d) => ({ label: d, value: d })),
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { type: 'text', name: 'inLanguage', label: 'Language' },
      ],
    },
    {
      type: 'group',
      name: 'breadcrumb',
      label: 'Breadcrumb',
      fields: [
        { type: 'text', name: 'breadcrumbId', label: '@id', required: true },
        {
          type: 'array',
          name: 'items',
          label: 'Items',
          fields: [
            { type: 'number', name: 'position', label: 'Position', required: true },
            { type: 'text', name: 'name', label: 'Name', required: true },
            { type: 'text', name: 'item', label: 'Item URL', required: true, validate: urlValidate },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'faq',
      label: 'FAQPage',
      fields: [
        { type: 'text', name: 'faqId', label: '@id', required: true },
        {
          type: 'array',
          name: 'mainEntity',
          label: 'Questions',
          fields: [
            { type: 'text', name: 'name', label: 'Question', required: true },
            { type: 'textarea', name: 'acceptedAnswer', label: 'Answer', required: true },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'website',
      label: 'WebSite',
      fields: [
        { type: 'text', name: 'websiteId', label: '@id', required: true },
        { type: 'text', name: 'url', label: 'URL', required: true, validate: urlValidate },
        { type: 'text', name: 'name', label: 'Name', required: true },
        {
          type: 'array',
          name: 'sameAs',
          label: 'Same As (URLs)',
          fields: [{ type: 'text', name: 'url', label: 'URL', validate: urlValidate }],
        },
        { type: 'text', name: 'inLanguage', label: 'Language' },
      ],
    },
  ],
}

export default ContactDetails