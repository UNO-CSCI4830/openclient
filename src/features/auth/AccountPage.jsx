import { useState } from 'react'
import { signOut, deleteUser } from 'firebase/auth'
import { auth } from '../../firebase'
import { deleteAllUserData } from '../savedSpecs/savedSpecs'
import SavedSpecsList from '../savedSpecs/SavedSpecsList'
import './AccountPage.css'

export default function AccountPage({ user, onLoadSpec, onClose }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDeleteAccount() {
    setDeleting(true)
    setError('')
    try {
      await deleteAllUserData(user.uid)
      await deleteUser(user)
    } catch (err) {
      setDeleting(false)
      setConfirmingDelete(false)
      setError(err.code === 'auth/requires-recent-login'
        ? 'Please sign out and sign back in before deleting your account.'
        : 'Failed to delete account. Please try again.')
    }
  }

  return (
    <div className="account-page">
      <div className="account-header">
        <h2>My Account</h2>
        <button className="account-close" onClick={onClose}>← Back</button>
      </div>
      <p className="account-email">{user.email}</p>
      <SavedSpecsList uid={user.uid} onLoad={(content) => { onLoadSpec(content); onClose() }} />
      <div className="account-actions">
        <button className="account-signout" onClick={() => signOut(auth)}>
          Sign Out
        </button>
        {!confirmingDelete ? (
          <button className="account-delete" onClick={() => setConfirmingDelete(true)}>
            Delete Account
          </button>
        ) : (
          <div className="account-delete-confirm">
            <span className="account-delete-confirm-text">This will permanently delete your account and all saved spec files. Are you sure?</span>
            <div className="account-delete-confirm-buttons">
              <button className="account-delete-yes" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button className="account-delete-no" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && <p className="account-delete-error">{error}</p>}
      </div>
    </div>
  )
}
