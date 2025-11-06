import type { CollectionConfig } from 'payload'

export const Personas: CollectionConfig = {
  slug: 'personas',
  labels: {
    singular: 'Persona',
    plural: 'Personas',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'updatedAt'],
    group: 'Content',
    description: 'Manage predefined personas selectable on user profiles',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  timestamps: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Persona name (e.g., Community Copywriter)' },
    },
    {
      name: 'category',
      type: 'text',
      admin: { description: 'Category (e.g., Emerging / Niche)' },
    },
    {
      name: 'focus',
      type: 'text',
      admin: { description: 'Primary focus of the persona' },
    },
    {
      name: 'strengths',
      type: 'array',
      admin: { description: 'Key strengths of the persona' },
      fields: [
        { name: 'value', type: 'text', required: true },
      ],
    },
    {
      name: 'uses',
      type: 'array',
      admin: { description: 'Typical use cases' },
      fields: [
        { name: 'value', type: 'text', required: true },
      ],
    },
    {
      name: 'personality',
      type: 'group',
      label: 'Personality',
      fields: [
        { name: 'tone', type: 'text' },
        { name: 'voice_style', type: 'text' },
        { name: 'motivations', type: 'textarea' },
        { name: 'audience_perception', type: 'textarea' },
      ],
    },
  ],
}

export default Personas