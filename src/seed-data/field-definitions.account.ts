// Account field definitions — Shape B (codegen-patterns jsonb value shape).
//
// Synthetic demo fields (NOT copied from a live CRM — these exercise the jsonb
// resolution path). data_type uses the codegen-patterns vocabulary
// (string/integer/decimal/boolean/picklist/…), distinct from dealbrain's
// Shape-A vocabulary on opportunity. Stored in the SHARED field_definitions
// table (entity_type='account'); their VALUES live in field_values_jsonb.
//
// Values are projected from each account's providerMetadata at seed time — see
// src/seed-data/build-eav.ts.

import type { FieldDefinitionSeed } from './field-definitions.opportunity';

export const ACCOUNT_FIELD_DEFINITIONS: readonly FieldDefinitionSeed[] = [
  { id: 'fd000001-0000-4000-8000-000000000001', key: 'Industry', label: 'Industry', dataType: 'picklist', selectOptions: ['fintech', 'manufacturing', 'retail', 'saas', 'health'], isKeyField: true, keyFieldOrder: 0, description: 'Primary industry vertical.' },
  { id: 'fd000001-0000-4000-8000-000000000002', key: 'EmployeeCount', label: 'Employee Count', dataType: 'integer', selectOptions: null, isKeyField: true, keyFieldOrder: 1, description: 'Headcount.' },
  { id: 'fd000001-0000-4000-8000-000000000003', key: 'Tier', label: 'Account Tier', dataType: 'picklist', selectOptions: ['Enterprise', 'Mid-Market', 'SMB'], isKeyField: true, keyFieldOrder: 2, description: 'Segment derived from headcount.' },
  { id: 'fd000001-0000-4000-8000-000000000004', key: 'AnnualRevenue', label: 'Annual Revenue', dataType: 'decimal', selectOptions: null, isKeyField: false, keyFieldOrder: null, description: 'Estimated annual revenue (USD).' },
  { id: 'fd000001-0000-4000-8000-000000000005', key: 'IsStrategic', label: 'Strategic Account', dataType: 'boolean', selectOptions: null, isKeyField: false, keyFieldOrder: null, description: 'Flagged strategic (headcount ≥ 1000).' },
] as const;
