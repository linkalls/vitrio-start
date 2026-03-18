/**
 * A magic-free Form component that wraps a standard HTML `<form>`.
 *
 * If the method is 'post' and a `csrfToken` is provided, it automatically injects
 * the hidden `_csrf` input required by the server for validation.
 *
 * This follows the framework's philosophy of explicit, simple HTML + PRG.
 */
export function Form(props: any) {
  const { method = 'post', csrfToken, children, ...rest } = props
  const isPost = String(method).toLowerCase() === 'post'

  return (
    <form method={method} {...rest}>
      {isPost && csrfToken && (
        <input type="hidden" name="_csrf" value={csrfToken} />
      )}
      {children}
    </form>
  )
}
