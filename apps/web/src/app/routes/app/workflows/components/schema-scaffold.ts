import type { AgentSchema, SchemaField } from '@/types/workflow';

function fieldPlaceholder(field: SchemaField, isRequired: boolean): unknown {
  switch (field.type) {
    case 'object': {
      if (field.properties) {
        const obj: Record<string, unknown> = {};
        for (const [key, subField] of Object.entries(field.properties)) {
          obj[key] = fieldPlaceholder(subField as SchemaField, false);
        }
        return obj;
      }
      return {};
    }
    case 'array':
      return [];
    case 'number':
      return isRequired ? '${{ }}' : 0;
    case 'boolean':
      return isRequired ? '${{ }}' : false;
    default:
      return isRequired ? '${{ }}' : '';
  }
}

export function generateScaffold(schema: AgentSchema): string {
  if (schema.type === 'array') {
    return JSON.stringify([], null, 2);
  }

  if (schema.type === 'object' && schema.properties) {
    const result: Record<string, unknown> = {};
    const required = new Set(schema.required ?? []);

    for (const [key, field] of Object.entries(schema.properties)) {
      result[key] = fieldPlaceholder(field, required.has(key));
    }

    return JSON.stringify(result, null, 2);
  }

  if (schema.type === 'string') {
    return '';
  }

  return '{}';
}
