import type { CollectionConfig, PayloadRequest } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'User', value: 'user' },
      ],
      admin: {
        position: 'sidebar',
        description: 'User role for access control',
      },
      access: {
        // Only admins can change roles
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    // Persona management (admin-only, not part of login/signup forms)
    {
      name: 'persona',
      type: 'group',
      label: 'Persona',
      admin: {
        description: 'Select a persona and optionally customize its profile for this user',
        position: 'sidebar',
      },
      fields: [
        {
          name: 'selectedPersona',
          type: 'relationship',
          relationTo: 'personas',
          hasMany: false,
          admin: {
            description: 'Choose a base persona from the predefined list',
          },
          access: {
            // Prevent public signup forms from setting this
            create: ({ req }) => !!req.user,
            update: ({ req }) => !!req.user,
          },
        },
        {
          name: 'profile',
          type: 'group',
          label: 'Persona Profile (Editable)',
          admin: {
            description: 'Snapshot of persona details that you can customize per user',
          },
          access: {
            // Editable only by authenticated users (e.g., admins)
            create: ({ req }) => !!req.user,
            update: ({ req }) => !!req.user,
          },
          fields: [
            { name: 'name', type: 'text' },
            { name: 'category', type: 'text' },
            { name: 'focus', type: 'text' },
            {
              name: 'strengths',
              type: 'array',
              fields: [{ name: 'value', type: 'text', required: true }],
            },
            {
              name: 'uses',
              type: 'array',
              fields: [{ name: 'value', type: 'text', required: true }],
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
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        // Auto-populate persona.profile from selectedPersona if profile is empty
        try {
          const personaId = data?.persona?.selectedPersona
          const hasProfile = !!data?.persona?.profile && Object.keys(data.persona.profile).length > 0

          if (personaId && (!hasProfile || operation === 'create')) {
            const personaDoc = await req.payload.findByID({ collection: 'personas', id: personaId })
            if (personaDoc) {
              data.persona = data.persona || {}
              data.persona.profile = {
                name: personaDoc.name || '',
                category: personaDoc.category || '',
                focus: personaDoc.focus || '',
                strengths: Array.isArray(personaDoc.strengths)
                  ? personaDoc.strengths.map((s: any) => ({ value: typeof s === 'string' ? s : s?.value || '' }))
                  : [],
                uses: Array.isArray(personaDoc.uses)
                  ? personaDoc.uses.map((u: any) => ({ value: typeof u === 'string' ? u : u?.value || '' }))
                  : [],
                personality: {
                  tone: personaDoc.personality?.tone || '',
                  voice_style: personaDoc.personality?.voice_style || '',
                  motivations: personaDoc.personality?.motivations || '',
                  audience_perception: personaDoc.personality?.audience_perception || '',
                },
              }
            }
          }
        } catch (e) {
          // Log but do not block user changes
          req.payload.logger?.warn?.(`Users.beforeValidate persona sync warning: ${String((e as Error)?.message || e)}`)
        }
        return data
      },
    ],
  },
}
