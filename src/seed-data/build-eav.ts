// Build EAV seed rows (field_definitions + field_values) from the deal seeds.
//
// INTERIM (pre-flip): sources values from the opportunity's real columns and
// projects them into typed field_values via toFieldValueColumns. After P4 the
// opportunity loses those columns and the deal files carry an EAV field bag
// instead — at which point this reads the bag, not the columns. Until then,
// the columns ARE the source of truth and this proves the substrate + resolver
// against production-shaped data without breaking the existing demo.

import { toFieldValueColumns } from '../query/eav-mapping';
import type { DealSeed } from './deal-types';
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

export function buildEavSeed(
  deals: readonly DealSeed[],
  userId: string,
): { fieldDefinitions: FieldDefinitionRow[]; fieldValues: FieldValueRow[] } {
  const defsByKey = new Map(OPPORTUNITY_FIELD_DEFINITIONS.map((d) => [d.key, d]));

  const fieldDefinitions: FieldDefinitionRow[] = OPPORTUNITY_FIELD_DEFINITIONS.map((d) => ({
    id: d.id,
    userId,
    label: d.label,
    key: d.key,
    dataType: d.dataType,
    entityType: 'opportunity',
    selectOptions: d.selectOptions,
    isKeyField: d.isKeyField,
    keyFieldOrder: d.keyFieldOrder,
    description: d.description,
  }));

  const fieldValues: FieldValueRow[] = [];
  const add = (entityId: string, key: string, value: unknown): void => {
    const def = defsByKey.get(key);
    if (!def || value == null) return;
    fieldValues.push({
      entityId,
      entityType: 'opportunity',
      fieldDefinitionId: def.id,
      ...toFieldValueColumns(value, def.dataType),
    });
  };

  for (const d of deals) {
    const o = d.opportunity;
    if (!o.id) continue;
    add(o.id, 'StageName', o.stage ? STAGE_TO_SF_LABEL[o.stage] : null);
    add(o.id, 'Amount', o.amount != null ? o.amount / 100 : null); // POC stores cents; SF Amount is dollars
    add(o.id, 'CloseDate', o.closeDate ?? null);
    add(o.id, 'NextStep', o.nextStep ?? null);
    add(o.id, 'Probability', o.probability ?? null);
    add(o.id, 'IsClosed', o.isClosed ?? null);
    add(o.id, 'IsWon', o.isWon ?? null);
    add(o.id, 'Description', o.description ?? null);
  }

  return { fieldDefinitions, fieldValues };
}
