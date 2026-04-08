function normalizeBase(base) {
  const value = base.trim()

  if (!value || value === `.` || value === `./`)
    return `./`

  const withoutEdgeSlashes = value.replace(/^\/+|\/+$/g, ``)

  if (!withoutEdgeSlashes)
    return `/`

  return `/${withoutEdgeSlashes}/`
}

export function resolveBuildBase(env = process.env) {
  const explicitBase = env.BUILD_BASE ?? env.VITE_BUILD_BASE

  if (explicitBase)
    return normalizeBase(explicitBase)

  if (env.SERVER_ENV === `NETLIFY`)
    return `/`

  return `./`
}
