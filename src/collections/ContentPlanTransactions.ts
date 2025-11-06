import type { CollectionConfig } from 'payload'

export const ContentPlanTransactions: CollectionConfig = {
  slug: 'contentPlanTransactions',
  admin: {
    useAsTitle: 'transactionId',
    defaultColumns: ['transactionId', 'contentPlanId', 'operation', 'status', 'createdAt'],
    group: 'System',
    description: 'Transaction logs for content plan operations'
  },
  access: {
    read: ({ req: { user } }) => {
      // Only admins can read transaction logs
      return user?.role === 'admin'
    },
    create: () => true, // Allow system to create transaction logs
    update: () => true, // Allow system to update transaction logs
    delete: ({ req: { user } }) => {
      // Only admins can delete transaction logs
      return user?.role === 'admin'
    }
  },
  timestamps: true,
  fields: [
    {
      name: 'transactionId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Unique identifier for the transaction'
      }
    },
    {
      name: 'contentPlanId',
      type: 'number',
      required: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'ID of the content plan being modified'
      }
    },
    {
      name: 'operation',
      type: 'select',
      required: true,
      defaultValue: 'save_generated',
      options: [
        { label: 'Save Generated', value: 'save_generated' },
        { label: 'Update Plan', value: 'update' },
        { label: 'Delete Plan', value: 'delete' }
      ],
      admin: {
        readOnly: true,
        description: 'Type of operation being performed'
      }
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Committed', value: 'committed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Rolled Back', value: 'rolled_back' }
      ],
      index: true,
      admin: {
        description: 'Current status of the transaction'
      }
    },
    {
      name: 'errorDetails',
      type: 'textarea',
      admin: {
        condition: (data) => data.status === 'failed',
        description: 'Error message if the transaction failed'
      }
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional metadata about the transaction'
      }
    },
    {
      name: 'retryCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of retry attempts made'
      }
    },
    {
      name: 'executionTimeMs',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Total execution time in milliseconds'
      }
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime'
        },
        description: 'When the transaction was completed (success or failure)'
      }
    }
  ]
}