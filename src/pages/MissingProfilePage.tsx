import BrandLockup from '../components/BrandLockup'

export default function MissingProfilePage({ onSignOut }: { onSignOut: () => Promise<void> }) {
  return (
    <main className="page">
      <section className="card centered-panel">
        <BrandLockup compact eyebrow="Setup required" subtitle="Your access was created, but the role profile is still missing." />
        <div className="empty-state">
          <h1>Profile not ready</h1>
          <p className="muted">
            Your account exists, but the matching role profile is not available yet. Ask CVDE administration to complete the
            database setup SQL so the role mapping can be created.
          </p>
        </div>
        <button type="button" onClick={onSignOut}>
          Sign out
        </button>
      </section>
    </main>
  )
}
