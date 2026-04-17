import './KeyValueEditor.css'

/**
 * Dynamic key/value row editor for custom headers and query parameters.
 * Users can add and remove arbitrary rows.
 *
 * @param {object} props
 * @param {Array<{ key: string, value: string }>} props.rows
 * @param {function} props.onChange - called with updated rows array
 * @param {string} props.addLabel - label for the add button (e.g. "Add header")
 * @param {string} [props.keyPlaceholder] - placeholder for key inputs
 * @param {string} [props.valuePlaceholder] - placeholder for value inputs
 * @param {boolean} [props.disabled] - whether inputs are disabled
 */
export default function KeyValueEditor({
  rows,
  onChange,
  addLabel,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  disabled = false,
}) {
  function handleKeyChange(index, newKey) {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, key: newKey } : row
    )
    onChange(updated)
  }

  function handleValueChange(index, newValue) {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, value: newValue } : row
    )
    onChange(updated)
  }

  function handleAdd() {
    onChange([...rows, { key: '', value: '' }])
  }

  function handleRemove(index) {
    onChange(rows.filter((_, i) => i !== index))
  }

  return (
    <div className="kv-editor">
      {rows.map((row, index) => (
        <div key={index} className="kv-editor-row">
          <input
            type="text"
            className="kv-editor-key"
            placeholder={keyPlaceholder}
            value={row.key}
            onChange={(e) => handleKeyChange(index, e.target.value)}
            disabled={disabled}
          />
          <input
            type="text"
            className="kv-editor-value"
            placeholder={valuePlaceholder}
            value={row.value}
            onChange={(e) => handleValueChange(index, e.target.value)}
            disabled={disabled}
          />
          <button
            type="button"
            className="kv-editor-remove"
            onClick={() => handleRemove(index)}
            disabled={disabled}
            aria-label={`Remove row ${index + 1}`}
          >
            &times;
          </button>
        </div>
      ))}

      <button
        type="button"
        className="kv-editor-add"
        onClick={handleAdd}
        disabled={disabled}
      >
        + {addLabel}
      </button>
    </div>
  )
}
