import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  tables: {
    users: {
      columns: {
        role: {
          tsType: 'Role',
          decorators: [{ name: '@column' }],
          imports: [{ source: '#enums/role_enum', namedImports: ['Role'] }],
        },
      },
    },

    catalogues: {
      columns: {
        category: {
          tsType: 'CatalogueCategory',
          decorators: [{ name: '@column' }],
          imports: [{ source: '#enums/catalogue_enum', namedImports: ['CatalogueCategory'] }],
        },
        type: {
          tsType: 'CatalogueType',
          decorators: [{ name: '@column' }],
          imports: [{ source: '#enums/catalogue_enum', namedImports: ['CatalogueType'] }],
        },
      },
    },

    operational_areas: {
      skipColumns: ['geometry'],
    },

    items: {
      columns: {
        type: {
          tsType: 'ItemType',
          decorators: [{ name: '@column' }],
          imports: [{ source: '#enums/item_enum', namedImports: ['ItemType'] }],
        },
      },
    },

    orders: {
      columns: {
        status: {
          tsType: 'OrderStatus',
          decorators: [{ name: '@column' }],
          imports: [{ source: '#enums/order_enum', namedImports: ['OrderStatus'] }],
        },
        type: {
          tsType: 'OrderType',
          decorators: [{ name: '@column' }],
          imports: [{ source: '#enums/order_enum', namedImports: ['OrderType'] }],
        },
        claimed_task: {
          tsType: 'TaskType',
          decorators: [{ name: '@column' }],
          imports: [{ source: '#enums/task_enum', namedImports: ['TaskType'] }],
        },
      },
    },

    order_actions: {
      columns: {
        name: {
          tsType: 'ActionName',
          decorators: [{ name: '@column' }],
          imports: [{ source: '#enums/order_action_enum', namedImports: ['ActionName'] }],
        },
      },
    },

    transactions: {
      columns: {
        status: {
          tsType: 'TransactionStatus',
          decorators: [{ name: '@column' }],
          imports: [{ source: '#enums/transaction_enum', namedImports: ['TransactionStatus'] }],
        },
        payment_method: {
          tsType: 'PaymentMethod',
          decorators: [{ name: '@column' }],
          imports: [{ source: '#enums/transaction_enum', namedImports: ['PaymentMethod'] }],
        },
      },
    },
  },
} satisfies SchemaRules
