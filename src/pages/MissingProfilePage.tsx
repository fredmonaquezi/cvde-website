export default function MissingProfilePage({ onSignOut }: { onSignOut: () => Promise<void> }) {
  return (
    <main className="page">
      <section className="card">
        <h1>Profile Not Ready</h1>
        <p className="muted">
          Your account exists, but your role profile is missing. Ask CVDE admin to run the database setup SQL files.
        </p>
        <button type="button" onClick={onSignOut}>
          Sign out
        </button>
      </section>
    </main>
  )
}
