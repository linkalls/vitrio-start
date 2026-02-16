export function App(props: { path: string }) {
  const path = props.path || '/'

  // Minimal SSR router (server-side). Client uses Vitrio Router.
  if (path === '/') {
    return (
      <div>
        <h1>Home</h1>
        <a href="/counter">Counter</a>
      </div>
    )
  }

  if (path === '/counter') {
    return (
      <div>
        <h1>Counter</h1>
        <p>(SSR preview; interactivity on client)</p>
        <a href="/">Home</a>
      </div>
    )
  }

  return (
    <div>
      <h1>404</h1>
      <a href="/">Home</a>
    </div>
  )
}
