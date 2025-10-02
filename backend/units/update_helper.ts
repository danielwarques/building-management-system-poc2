interface UpdateField {
  column: string;
  value: any;
}

export function buildUpdateQuery(
  tableName: string,
  updates: UpdateField[],
  whereClause: string,
  whereValue: any
): { query: string; values: any[] } {
  if (updates.length === 0) {
    throw new Error("No fields to update");
  }

  const setStatements = updates.map((field, idx) => `${field.column} = $${idx + 1}`);
  setStatements.push(`updated_at = NOW()`);

  const values = [...updates.map(u => u.value), whereValue];

  const query = `
    UPDATE ${tableName}
    SET ${setStatements.join(', ')}
    WHERE ${whereClause} = $${values.length}
    RETURNING *
  `;

  return { query, values };
}
