# Adding Routes - Quick Reference

This guide provides copy-paste templates for common routing scenarios.

## Table of Contents

- [Basic Route](#basic-route)
- [Route with Loader](#route-with-loader)
- [Route with Action (Form)](#route-with-action-form)
- [Protected Route (Redirect)](#protected-route-redirect)
- [Not Found Route](#not-found-route)
- [Parameterized Route](#parameterized-route)

---

## Basic Route

A simple route that renders static content.

```tsx
{
  path: '/about',
  component: () => (
    <div>
      <h1>About</h1>
      <p>This is the about page.</p>
      <a href="/">Back to Home</a>
    </div>
  ),
}
```

---

## Route with Loader

Fetch data on the server before rendering.

```tsx
{
  path: '/posts',
  loader: async () => {
    // This runs on the server (SSR) and client (navigation)
    const posts = await fetchPosts()
    return { posts }
  },
  component: ({ data }) => (
    <div>
      <h1>Posts</h1>
      <ul>
        {data.posts.map((post: any) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  ),
}
```

---

## Route with Action (Form)

Handle form submissions with POST → Redirect → GET pattern.

```tsx
import { z } from 'zod'
import { parseFormData } from './server/form'

// 1. Define validation schema
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  message: z.string().min(10, 'Message too short'),
})

// 2. Define action
async function contactAction(ctx: any, formData: FormData) {
  const input = parseFormData(formData, contactSchema)
  
  // Process the form (e.g., send email, save to DB)
  await sendContactEmail(input)
  
  // Return success (will trigger flash cookie and redirect)
  return { success: true }
}

// 3. Define route
{
  path: '/contact',
  loader: () => ({ submitted: false }),
  action: contactAction,
  component: ({ data, csrfToken }) => (
    <div>
      <h1>Contact Us</h1>
      <form method="post">
        <input type="hidden" name="_csrf" value={csrfToken} />
        
        <label>
          Name:
          <input name="name" type="text" required />
        </label>
        
        <label>
          Email:
          <input name="email" type="email" required />
        </label>
        
        <label>
          Message:
          <textarea name="message" required />
        </label>
        
        <button type="submit">Send</button>
      </form>
    </div>
  ),
}
```

---

## Protected Route (Redirect)

Redirect unauthenticated users to login.

```tsx
import { redirect } from './server/response'

{
  path: '/dashboard',
  loader: async (ctx) => {
    // Check authentication
    const user = await getCurrentUser(ctx)
    if (!user) {
      return redirect('/login')
    }
    
    // User is authenticated, fetch dashboard data
    const stats = await getDashboardStats(user.id)
    return { user, stats }
  },
  component: ({ data }) => (
    <div>
      <h1>Welcome, {data.user.name}</h1>
      <p>Stats: {JSON.stringify(data.stats)}</p>
    </div>
  ),
}
```

---

## Not Found Route

Return 404 status from loader.

```tsx
import { notFound } from './server/response'

{
  path: '/posts/:id',
  loader: async (ctx) => {
    const post = await fetchPost(ctx.params.id)
    if (!post) {
      return notFound()
    }
    return { post }
  },
  component: ({ data }) => (
    <div>
      <h1>{data.post.title}</h1>
      <p>{data.post.content}</p>
    </div>
  ),
}
```

---

## Parameterized Route

Extract URL parameters.

```tsx
{
  path: '/users/:userId/posts/:postId',
  loader: async (ctx) => {
    const { userId, postId } = ctx.params
    
    const user = await fetchUser(userId)
    const post = await fetchPost(postId)
    
    if (!user || !post || post.authorId !== userId) {
      return notFound()
    }
    
    return { user, post }
  },
  component: ({ data }) => (
    <div>
      <h2>{data.post.title}</h2>
      <p>By {data.user.name}</p>
      <p>{data.post.content}</p>
    </div>
  ),
}
```

---

## Route with Action Redirect

Action that redirects to another page.

```tsx
import { redirect } from './server/response'

{
  path: '/logout',
  loader: () => ({ ok: true }),
  action: async (ctx, formData) => {
    // Clear session/cookies
    await logout(ctx)
    
    // Redirect to home
    return redirect('/')
  },
  component: ({ csrfToken }) => (
    <div>
      <h1>Logout</h1>
      <form method="post">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <button type="submit">Confirm Logout</button>
      </form>
    </div>
  ),
}
```

---

## Notes

### PRG Pattern (POST-Redirect-GET)

All POST actions in vitrio-start follow the PRG pattern by default:

1. User submits form (POST)
2. Server processes action
3. Server redirects (303) back to same URL or another page (GET)
4. Browser loads the page with a GET request

This prevents duplicate form submissions and makes the back button work correctly.

### Flash Messages

After a POST action, the framework automatically sets a flash cookie:
- `{ ok: true }` if action succeeds
- `{ ok: false }` if action fails or CSRF check fails

Access flash in your client code via `globalThis.__VITRIO_FLASH__`.

### CSRF Protection

All POST forms must include the CSRF token:

```tsx
<input type="hidden" name="_csrf" value={csrfToken} />
```

The framework automatically validates this token against the cookie.

### Loader Cache

In SSR, loaders are executed once on the server and their results are "primed" into the client cache. This prevents the loader from running twice (once on server, once on client).

The cache key is: `routeId + params + search`, where `routeId` defaults to the route `path`.
