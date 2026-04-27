import { useEffect, useState } from 'react'
import { loadSpecs, deleteSpec } from './savedSpecs'
import './SavedSpecsList.css'

export default function SavedSpecsList({ uid, onLoad }) {
  const [specs, setSpecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState(null)

  useEffect(() => {
    loadSpecs(uid).then((data) => {
      setSpecs(data)
      setLoading(false)
    })
  }, [uid])

  async function handleDelete(specId) {
    await deleteSpec(uid, specId)
    setSpecs((prev) => prev.filter((s) => s.id !== specId))
    setConfirmingId(null)
  }

  if (loading || specs.length === 0) return null

  return (
    <div className="saved-specs">
      <h3>Saved Specs</h3>
      <ul className="saved-specs-list">
        {specs.map((spec) => (
          <li key={spec.id} className="saved-spec-item">
            <span className="saved-spec-name">{spec.name}</span>
            <div className="saved-spec-actions">
              {confirmingId === spec.id ? (
                <>
                  <span className="saved-spec-confirm-text">Are you sure?</span>
                  <button className="saved-spec-confirm-yes" onClick={() => handleDelete(spec.id)}>
                    Yes
                  </button>
                  <button className="saved-spec-confirm-no" onClick={() => setConfirmingId(null)}>
                    No
                  </button>
                </>
              ) : (
                <>
                  <button className="saved-spec-load" onClick={() => onLoad(spec.content)}>
                    Load
                  </button>
                  <button className="saved-spec-delete" onClick={() => setConfirmingId(spec.id)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
