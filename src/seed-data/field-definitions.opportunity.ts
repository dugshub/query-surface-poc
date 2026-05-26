// Opportunity field definitions — captured VERBATIM from the live dealbrain DB
// (postgresql://postgres@localhost:54321/dealbrain, entity_type='opportunity').
//
// Real Salesforce field keys, data_types, picklists, and the original
// field_definition UUIDs are preserved so the POC's EAV resolution matches
// production exactly. Only `userId` is rebound at seed time (to the POC's
// single seed user) — see src/seed.ts.
//
// This is a one-time snapshot so seeding doesn't depend on the live DB being
// up. Re-capture with the query in HANDOFF if dealbrain's field set changes.
//
// The full opportunity catalog is 46 fields; this is the subset the POC seeds
// values for (the 8 canonical filter fields) plus a few defined-but-unpopulated
// fields (Name/Type/LeadSource/ForecastCategoryName) so query_describe shows a
// realistic, partially-sparse field catalog.

export interface FieldDefinitionSeed {
  id: string;
  key: string;
  label: string;
  dataType: string;
  selectOptions: string[] | null;
  isKeyField: boolean;
  keyFieldOrder: number | null;
  description: string | null;
}

export const OPPORTUNITY_FIELD_DEFINITIONS: readonly FieldDefinitionSeed[] = [
  { id: 'efb7cf99-9540-4cb6-9be4-2aa173602c4f', key: 'NextStep', label: 'Next Step', dataType: 'text', selectOptions: null, isKeyField: true, keyFieldOrder: 0, description: null },
  { id: '22fa68cc-fde8-433e-8c38-0fb61b500502', key: 'CloseDate', label: 'Close Date', dataType: 'date', selectOptions: null, isKeyField: true, keyFieldOrder: 1, description: null },
  { id: 'd63c0be5-2c08-4610-a4da-c89fd87da005', key: 'Amount', label: 'Amount', dataType: 'money', selectOptions: null, isKeyField: true, keyFieldOrder: 2, description: null },
  { id: '2fa5bad4-ed59-4d23-94c1-86f5fd031ebd', key: 'StageName', label: 'Stage', dataType: 'select', selectOptions: ['Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition', 'Id. Decision Makers', 'Perception Analysis', 'Proposal/Price Quote', 'Negotiation/Review', 'Closed Won', 'Closed Lost'], isKeyField: true, keyFieldOrder: 3, description: null },
  { id: 'c63860a7-5e27-4b87-b643-38c5e43db718', key: 'Probability', label: 'Probability (%)', dataType: 'percentage', selectOptions: null, isKeyField: false, keyFieldOrder: null, description: null },
  { id: 'c643a25a-75eb-4efc-b4ad-5b89e93387f9', key: 'IsClosed', label: 'Closed', dataType: 'boolean', selectOptions: null, isKeyField: false, keyFieldOrder: null, description: null },
  { id: '350c5384-1be0-452a-bbcd-4c2f429f420e', key: 'IsWon', label: 'Won', dataType: 'boolean', selectOptions: null, isKeyField: false, keyFieldOrder: null, description: null },
  { id: 'd7eeafb5-e841-4fb2-a1d6-96476e44b13e', key: 'Description', label: 'Description', dataType: 'longtext', selectOptions: null, isKeyField: false, keyFieldOrder: null, description: null },
  // Defined-but-unpopulated in the POC seed — exercises sparse-catalog discovery.
  { id: '36614fe3-2bc5-4456-a391-3e4b60ee8d04', key: 'Name', label: 'Name', dataType: 'text', selectOptions: null, isKeyField: false, keyFieldOrder: null, description: null },
  { id: '80e5ed7d-9673-4d18-8898-6cf2a93243dd', key: 'Type', label: 'Opportunity Type', dataType: 'select', selectOptions: ['Existing Customer - Upgrade', 'Existing Customer - Replacement', 'Existing Customer - Downgrade', 'New Customer'], isKeyField: false, keyFieldOrder: null, description: null },
  { id: '438b9fd5-27c9-4ed7-b7fb-7e4a5a7bdfb1', key: 'LeadSource', label: 'Lead Source', dataType: 'select', selectOptions: ['Web', 'Phone Inquiry', 'Partner Referral', 'Purchased List', 'Other'], isKeyField: false, keyFieldOrder: null, description: null },
  { id: '819de79e-8ec8-4db3-87c8-2e0183802358', key: 'ForecastCategoryName', label: 'Forecast Category', dataType: 'select', selectOptions: ['Omitted', 'Pipeline', 'Best Case', 'Commit', 'Closed'], isKeyField: false, keyFieldOrder: null, description: null },
] as const;

// POC stage enum (lowercase) → real Salesforce StageName picklist label.
// The POC's `opportunity.stage` enum predates the EAV migration; this maps it
// onto the production StageName vocabulary so the EAV demo is faithful.
export const STAGE_TO_SF_LABEL: Record<string, string> = {
  prospect: 'Prospecting',
  qualifying: 'Qualification',
  presenting: 'Value Proposition',
  negotiation: 'Negotiation/Review',
  closing: 'Proposal/Price Quote',
  won: 'Closed Won',
  lost: 'Closed Lost',
};
