import './SchemaList.css'

/**
 * Displays all API data models/schemas with type info and usage counts.
 *
 * @param {object} props
 * @param {Array} props.schemas - Schema array from apiModel.schemas
 */
export default function SchemaList({ schemas }) {
  return (
    <section className="schema-list">
      <h2>Schemas ({schemas.length})</h2>

      <ul className="schema-list-items">
        {schemas.map((entry) => (
          <li key={entry.name} className="schema-list-item">
            <div className="schema-list-header">
              <h3 className="schema-list-name">{entry.name}</h3>
              {entry.schema.type && (
                <span className="schema-list-type">{entry.schema.type}</span>
              )}
            </div>

            <p className="schema-list-summary">
              {summarizeSchema(entry.schema)}
            </p>

            <p className="schema-list-usage">
              Used by {entry.usedBy.length} endpoint{entry.usedBy.length !== 1 && 's'}
            </p>

            {/* TODO: expandable property table */}
            {/* TODO: render enum values */}
            {/* TODO: clickable usedBy endpoint links */}
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Produces a short summary string for a schema based on its type.
 */
function summarizeSchema(schema) {
  if (schema.type === 'object') {
    const propCount = Object.keys(schema.properties || {}).length
    return `${propCount} ${propCount === 1 ? 'property' : 'properties'}`
  }

  if (schema.type === 'array' && schema.items) {
    const itemType = schema.items.type || 'object'
    return `array of ${itemType}`
  }

  if (schema.enum) {
    const preview = schema.enum.slice(0, 4).join(', ')
    const more = schema.enum.length > 4 ? `, +${schema.enum.length - 4} more` : ''
    return `enum: ${preview}${more}`
  }

  return schema.type || 'unknown type'
}
