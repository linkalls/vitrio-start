# Example Routes

This file contains ready-to-use example routes that you can add to `src/routes.tsx`.

## Login Page Example

A complete login page with form validation, action, and redirect.

```tsx
import { z } from 'zod'
import { parseFormData } from './server/form'
import { redirect, notFound } from './server/response'

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Login action
async function loginAction(ctx: any, formData: FormData) {
  const input = parseFormData(formData, loginSchema)
  
  // TODO: Replace with your actual authentication logic
  const user = await authenticateUser(input.email, input.password)
  
  if (!user) {
    // Invalid credentials - will redirect back with flash { ok: false }
    return notFound()
  }
  
  // TODO: Set session cookie here
  // setAuthCookie(ctx, user.id)
  
  // Success - redirect to dashboard
  return redirect('/dashboard')
}

// Login route
{
  path: '/login',
  loader: async (ctx) => {
    // If already logged in, redirect to dashboard
    const user = await getCurrentUser(ctx)
    if (user) {
      return redirect('/dashboard')
    }
    return { showForm: true }
  },
  action: loginAction,
  component: ({ data, csrfToken }) => (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1>Login</h1>
      <form method="post" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="hidden" name="_csrf" value={csrfToken} />
        
        <div>
          <label>Email:</label>
          <input 
            name="email" 
            type="email" 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div>
          <label>Password:</label>
          <input 
            name="password" 
            type="password" 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <button 
          type="submit" 
          style={{ 
            padding: '10px', 
            background: '#1976d2', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </form>
      
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        <a href="/">← Back to Home</a>
      </p>
    </div>
  ),
}
```

---

## Protected Route Example

A dashboard that requires authentication.

```tsx
import { redirect } from './server/response'

{
  path: '/dashboard',
  loader: async (ctx) => {
    // Check if user is authenticated
    const user = await getCurrentUser(ctx)
    
    if (!user) {
      // Not authenticated - redirect to login
      return redirect('/login')
    }
    
    // User is authenticated - fetch dashboard data
    const stats = await getDashboardStats(user.id)
    
    return { user, stats }
  },
  component: ({ data }) => (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h1>Dashboard</h1>
      <p>Welcome, {data.user.name}!</p>
      
      <div style={{ marginTop: '30px' }}>
        <h2>Your Stats</h2>
        <pre>{JSON.stringify(data.stats, null, 2)}</pre>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <a href="/logout">Logout</a>
      </div>
    </div>
  ),
}
```

---

## Logout Route Example

A simple logout route that clears the session.

```tsx
import { redirect } from './server/response'

{
  path: '/logout',
  loader: () => ({ ok: true }),
  action: async (ctx, formData) => {
    // TODO: Clear session cookie
    // clearAuthCookie(ctx)
    
    // Redirect to home page
    return redirect('/')
  },
  component: ({ csrfToken }) => (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', textAlign: 'center' }}>
      <h1>Logout</h1>
      <p>Are you sure you want to logout?</p>
      
      <form method="post" style={{ marginTop: '20px' }}>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <button 
          type="submit"
          style={{ 
            padding: '10px 20px', 
            background: '#d32f2f', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Confirm Logout
        </button>
      </form>
      
      <p style={{ marginTop: '20px' }}>
        <a href="/dashboard">← Back to Dashboard</a>
      </p>
    </div>
  ),
}
```

---

## Blog Post Detail (with 404)

A route that shows a blog post or returns 404 if not found.

```tsx
import { notFound } from './server/response'

{
  path: '/blog/:slug',
  loader: async (ctx) => {
    const post = await fetchPostBySlug(ctx.params.slug)
    
    if (!post) {
      return notFound()
    }
    
    return { post }
  },
  component: ({ data }) => (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <article>
        <h1>{data.post.title}</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Published on {new Date(data.post.publishedAt).toLocaleDateString()}
        </p>
        <div style={{ marginTop: '30px', lineHeight: 1.8 }}>
          {data.post.content}
        </div>
      </article>
      
      <p style={{ marginTop: '40px' }}>
        <a href="/blog">← Back to Blog</a>
      </p>
    </div>
  ),
}
```

---

## Comment Form Example

A route with a form to submit comments.

```tsx
import { z } from 'zod'
import { parseFormData } from './server/form'

const commentSchema = z.object({
  author: z.string().min(1, 'Name is required'),
  text: z.string().min(10, 'Comment must be at least 10 characters'),
})

async function submitCommentAction(ctx: any, formData: FormData) {
  const input = parseFormData(formData, commentSchema)
  
  // Save comment to database
  await saveComment({
    postId: ctx.params.id,
    author: input.author,
    text: input.text,
    createdAt: new Date(),
  })
  
  // Return success (will flash { ok: true } and redirect back)
  return { success: true }
}

{
  path: '/posts/:id',
  loader: async (ctx) => {
    const post = await fetchPost(ctx.params.id)
    const comments = await fetchComments(ctx.params.id)
    
    if (!post) {
      return notFound()
    }
    
    return { post, comments }
  },
  action: submitCommentAction,
  component: ({ data, csrfToken }) => (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h1>{data.post.title}</h1>
      <p>{data.post.content}</p>
      
      <h2 style={{ marginTop: '40px' }}>Comments ({data.comments.length})</h2>
      
      <div style={{ marginTop: '20px' }}>
        {data.comments.map((comment: any) => (
          <div key={comment.id} style={{ 
            padding: '15px', 
            background: '#f5f5f5', 
            marginBottom: '10px',
            borderRadius: '4px'
          }}>
            <strong>{comment.author}</strong>
            <p>{comment.text}</p>
          </div>
        ))}
      </div>
      
      <h3 style={{ marginTop: '30px' }}>Add a Comment</h3>
      <form method="post" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="hidden" name="_csrf" value={csrfToken} />
        
        <input 
          name="author" 
          placeholder="Your name"
          required
          style={{ padding: '10px' }}
        />
        
        <textarea 
          name="text" 
          placeholder="Your comment"
          required
          rows={4}
          style={{ padding: '10px' }}
        />
        
        <button 
          type="submit"
          style={{ 
            padding: '10px', 
            background: '#1976d2', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Submit Comment
        </button>
      </form>
    </div>
  ),
}
```

---

## Helper Functions (Add to `src/server/auth.ts`)

```tsx
// Example authentication helpers (implement these based on your needs)

export async function authenticateUser(email: string, password: string) {
  // TODO: Implement your authentication logic
  // Example: check against database, verify password hash, etc.
  return null // Return user object if valid, null if invalid
}

export async function getCurrentUser(ctx: any) {
  // TODO: Implement session/cookie checking
  // Example: read session cookie, query user from database
  return null // Return user object if authenticated, null otherwise
}

export async function getDashboardStats(userId: string) {
  // TODO: Fetch user-specific statistics
  return {
    posts: 10,
    comments: 25,
    likes: 100,
  }
}

export function setAuthCookie(ctx: any, userId: string) {
  // TODO: Set authentication cookie
  // Example using Hono:
  // setCookie(ctx, 'auth_token', userId, { 
  //   httpOnly: true, 
  //   secure: true, 
  //   sameSite: 'Lax',
  //   maxAge: 60 * 60 * 24 * 7 // 7 days
  // })
}

export function clearAuthCookie(ctx: any) {
  // TODO: Clear authentication cookie
  // Example using Hono:
  // setCookie(ctx, 'auth_token', '', { maxAge: 0 })
}
```

---

## Notes

- All these examples follow the PRG (POST-Redirect-GET) pattern
- CSRF protection is required for all POST forms
- Validation is done with Zod for type safety
- Examples use inline styles for simplicity (use CSS in production)
- Remember to implement the TODO items based on your specific needs
