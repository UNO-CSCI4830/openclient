import { useState, useCallback, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import { saveSpec } from './features/savedSpecs/savedSpecs'
import Header from './components/Header'
import Footer from './components/Footer'
import Login from './features/auth/Login'
import AccountPage from './features/auth/AccountPage'
import SavedSpecsList from './features/savedSpecs/SavedSpecsList'
import SpecInput from './features/specInput/SpecInput'
import ValidationResults from './features/specValidation/ValidationResults'
import MetadataView from './features/metadataView/MetadataView'
import { validateSpec } from './features/specValidation/validateSpec'
import { parseSpec } from './features/specParsing/parseSpec'
import SchemaList from './features/schemaList/SchemaList'
import EndpointList from './features/endpointList/EndpointList'
import GlobalConfig from './features/globalConfig/GlobalConfig'
import './App.css'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [skippedAuth, setSkippedAuth] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [isFromSaved, setIsFromSaved] = useState(false)
  const [specData, setSpecData] = useState(null)                 // raw parsed spec + metadata
  const [validating, setValidating] = useState(false)            // true while validation runs
  const [validationResult, setValidationResult] = useState(null) // { valid, errors, spec? }
  const [apiModel, setApiModel] = useState(null)                 // parsed internal model
  const [serverUrl, setServerUrl] = useState('')                  // global base URL for requests


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null)
      if (firebaseUser) {
        setShowLogin(false)
        setSkippedAuth(false)
        setSpecData(null)
        setValidationResult(null)
        setApiModel(null)
        setServerUrl('')
        setShowAccount(false)
      } else {
        setShowAccount(false)
        setShowLogin(false)
      }
    })
    return unsubscribe
  }, [])

  const resetAll = useCallback(() => {
    setSpecData(null)
    setValidating(false)
    setValidationResult(null)
    setApiModel(null)
    setServerUrl('')
  }, [])

  async function handleSpecLoaded({ spec, format, source }) {
    if (source !== 'saved') setIsFromSaved(false)
    setSpecData({ spec, format, source })
    setValidationResult(null)
    setApiModel(null)
    setValidating(true)

    const result = await validateSpec(spec)
    setValidating(false)
    setValidationResult(result)

    if (result.valid) {
      const model = parseSpec(result.spec)
      setApiModel(model)
      setServerUrl(model.servers.length > 0 ? model.servers[0].url : '')
    }
  }

  const specAccepted = validationResult?.valid

  async function handleSaveSpec() {
    if (!user || !specData || !saveName.trim()) return
    setSaveStatus('Saving…')
    try {
      await saveSpec(user.uid, {
        name: saveName.trim(),
        content: JSON.stringify(specData.spec),
      })
      setSaveStatus('Saved!')
      setShowSaveInput(false)
      setSaveName('')
      setIsFromSaved(true)
    } catch {
      setSaveStatus('Save failed.')
    } finally {
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  function handleLoadSavedSpec(content) {
    try {
      const spec = JSON.parse(content)
      setIsFromSaved(true)
      handleSpecLoaded({ spec, format: 'json', source: 'saved' })
    } catch {
    }
  }

  if (user === undefined) return null

  if (user === null && !skippedAuth) {
    return (
      <div className="app">
        <Header hideMenu />
        <main><Login onSkip={() => setSkippedAuth(true)} /></main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app">
      <Header
        user={user}
        onAccount={() => setShowAccount(true)}
        onSignOut={() => signOut(auth)}
        onLogin={() => setShowLogin(true)}
        onNewSpec={() => { resetAll(); setShowAccount(false); setShowLogin(false) }}
        showNewSpec={!!(specData || showAccount || showLogin)}
        onLoginPage={showLogin}
      />
      <main>
        {showLogin && !user && (
          <Login onSkip={() => { setShowLogin(false); setSkippedAuth(true) }} />
        )}
        {!showLogin && showAccount && user && (
          <AccountPage
            user={user}
            onLoadSpec={handleLoadSavedSpec}
            onClose={() => setShowAccount(false)}
          />
        )}
        {!showLogin && !showAccount && <>
        {/* Step 1: Input (FR1) */}
        {!specData && <SpecInput onSpecLoaded={handleSpecLoaded} />}

        {/* Step 2: Validation (FR2) */}
        {specData && (!specAccepted || validating) && (
          <ValidationResults
            validating={validating}
            result={validationResult}
            onReload={resetAll}
          />
        )}

        {/* Step 3: Main app view (FR4/FR5/FR6) */}
        {specData && specAccepted && apiModel && (
          <div className="api-view">
            {/* FR4: API Metadata */}
            <MetadataView
              apiModel={apiModel}
              source={specData.source}
            />

            {/* Request configuration */}
            <GlobalConfig
              servers={apiModel.servers}
              serverUrl={serverUrl}
              onServerUrlChange={setServerUrl}
            />

            {/* FR6: Schema aggregation */}
            <SchemaList schemas={apiModel.schemas} />

            {/* FR5: Endpoint aggregation */}
            <EndpointList
              endpoints={apiModel.endpoints}
              tags={apiModel.tags}
              serverUrl={serverUrl}
            />

            <div className="action-bar">
              <button className="secondary-btn" onClick={resetAll}>
                Load Different Spec
              </button>
              {user && !showSaveInput && !isFromSaved && (
                <button className="secondary-btn action-bar-right" onClick={() => { setSaveName(''); setShowSaveInput(true) }}>
                  {saveStatus || 'Save Spec'}
                </button>
              )}
              {user && showSaveInput && !isFromSaved && (
                <div className="save-spec-inline">
                  <input
                    className="save-spec-input"
                    type="text"
                    placeholder="Name this spec…"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSpec()}
                    autoFocus
                  />
                  <button className="save-spec-confirm" onClick={handleSaveSpec} disabled={!saveName.trim()}>
                    Save
                  </button>
                  <button className="save-spec-cancel" onClick={() => { setShowSaveInput(false); setSaveName('') }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        </>}
      </main>
      <Footer />
    </div>
  )
}
