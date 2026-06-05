// Build EAV seed rows (field_definitions + field_values) from the deal seeds.
//
// INTERIM (pre-flip): sources values from the opportunity's real columns and
// projects them into typed field_values via toFieldValueColumns. After P4 the
// opportunity loses those columns and the deal files carry an EAV field bag
// instead — at which point this reads the bag, not the columns. Until then,
// the columns ARE the source of truth and this proves the substrate + resolver
// against production-shaped data without breaking the existing demo.

import { toFieldValueColumns } from '../query/eav/mapping';
import type { DealSeed } from './deal-types';
import { ACCOUNT_FIELD_DEFINITIONS } from './field-definitions.account';
import {
  OPPORTUNITY_FIELD_DEFINITIONS,
  STAGE_TO_SF_LABEL,
} from './field-definitions.opportunity';

export interface FieldDefinitionRow {
  id: string;
  userId: string;
  label: string;
  key: string;
  dataType: string;
  entityType: string;
  selectOptions: string[] | null;
  isVisible: boolean;
  isKeyField: boolean;
  keyFieldOrder: number | null;
  description: string | null;
}

export interface FieldValueRow {
  entityId: string;
  entityType: string;
  fieldDefinitionId: string;
  valueText: string | null;
  valueNumber: string | null;
  valueDate: Date | null;
  valueBoolean: boolean | null;
}

// Shape B — single jsonb value, current row (valid_to null).
export interface FieldValueJsonbRow {
  entityId: string;
  entityType: string;
  fieldDefinitionId: string;
  userId: string;
  value: unknown;
  validFrom: Date | null;
  validTo: Date | null;
}

function toDefRow(d: { id: string; label: string; key: string; dataType: string; selectOptions: string[] | null; isKeyField: boolean; keyFieldOrder: number | null; description: string | null }, userId: string, entityType: string): FieldDefinitionRow {
  return {
    id: d.id,
    userId,
    label: d.label,
    key: d.key,
    dataType: d.dataType,
    entityType,
    selectOptions: d.selectOptions,
    // Seeded fields are all "seller-selected" — the loader filters on this,
    // so a false here would make the field invisible to the query surface.
    isVisible: true,
    isKeyField: d.isKeyField,
    keyFieldOrder: d.keyFieldOrder,
    description: d.description,
  };
}

export function buildEavSeed(
  deals: readonly DealSeed[],
  userId: string,
): {
  fieldDefinitions: FieldDefinitionRow[];
  fieldValues: FieldValueRow[];
  fieldValuesJsonb: FieldValueJsonbRow[];
} {
  const oppDefsByKey = new Map(OPPORTUNITY_FIELD_DEFINITIONS.map((d) => [d.key, d]));
  const acctDefsByKey = new Map(ACCOUNT_FIELD_DEFINITIONS.map((d) => [d.key, d]));

  // Shared field_definitions table: opportunity (Shape A) + account (Shape B).
  const fieldDefinitions: FieldDefinitionRow[] = [
    ...OPPORTUNITY_FIELD_DEFINITIONS.map((d) => toDefRow(d, userId, 'opportunity')),
    ...ACCOUNT_FIELD_DEFINITIONS.map((d) => toDefRow(d, userId, 'account')),
  ];

  // ── Shape A: opportunity → typed value columns ──
  const fieldValues: FieldValueRow[] = [];
  const addOpp = (entityId: string, key: string, value: unknown): void => {
    const def = oppDefsByKey.get(key);
    if (!def || value == null) return;
    fieldValues.push({
      entityId,
      entityType: 'opportunity',
      fieldDefinitionId: def.id,
      ...toFieldValueColumns(value, def.dataType),
    });
  };

  // ── Shape B: account → single jsonb value (current row) ──
  const fieldValuesJsonb: FieldValueJsonbRow[] = [];
  const addAcct = (entityId: string, key: string, value: unknown): void => {
    const def = acctDefsByKey.get(key);
    if (!def || value == null) return;
    fieldValuesJsonb.push({
      entityId,
      entityType: 'account',
      fieldDefinitionId: def.id,
      userId,
      value,
      validFrom: null,
      validTo: null,
    });
  };

  for (const d of deals) {
    const o = d.opportunity;
    if (o.id) {
      addOpp(o.id, 'StageName', o.stage ? STAGE_TO_SF_LABEL[o.stage] : null);
      addOpp(o.id, 'Amount', o.amount != null ? o.amount / 100 : null); // cents → dollars
      addOpp(o.id, 'CloseDate', o.closeDate ?? null);
      addOpp(o.id, 'NextStep', o.nextStep ?? null);
      addOpp(o.id, 'Probability', o.probability ?? null);
      addOpp(o.id, 'IsClosed', o.isClosed ?? null);
      addOpp(o.id, 'IsWon', o.isWon ?? null);
      addOpp(o.id, 'Description', o.description ?? null);
    }

    const a = d.account;
    const pm = (a.providerMetadata ?? null) as { industry?: string; employee_count?: number } | null;
    const emp = pm?.employee_count;
    if (a.id) {
      addAcct(a.id, 'Industry', pm?.industry ?? null);
      addAcct(a.id, 'EmployeeCount', emp ?? null);
      addAcct(a.id, 'Tier', emp != null ? (emp >= 2000 ? 'Enterprise' : emp >= 300 ? 'Mid-Market' : 'SMB') : null);
      addAcct(a.id, 'AnnualRevenue', emp != null ? emp * 250000 : null);
      addAcct(a.id, 'IsStrategic', emp != null ? emp >= 1000 : null);
    }
  }

  return { fieldDefinitions, fieldValues, fieldValuesJsonb };
}
