import { manualRoutes } from './routes.manual'
import { compileRoutes, type RouteDef } from './route'
import { fsRoutes, fsApiRoutes } from './routes.fs.gen'

// File router routes come first (more "Next-like")
export const routes: RouteDef[] = [...fsRoutes, ...manualRoutes]

export const compiledRoutes = compileRoutes(routes)
export { fsApiRoutes }
