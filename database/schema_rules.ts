import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  types: {
    decimal: {
      decorator: '@column()',
      tsType: 'number',
    },
  },
} satisfies SchemaRules
