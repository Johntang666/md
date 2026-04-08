import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveBuildBase } from './resolve-build-base.js'

test(`uses a portable relative base by default`, () => {
  assert.equal(resolveBuildBase({}), `./`)
})

test(`normalizes custom subdirectory bases`, () => {
  assert.equal(resolveBuildBase({ BUILD_BASE: `md` }), `/md/`)
  assert.equal(resolveBuildBase({ BUILD_BASE: `/docs/app` }), `/docs/app/`)
})

test(`preserves an explicit relative base`, () => {
  assert.equal(resolveBuildBase({ BUILD_BASE: `./` }), `./`)
  assert.equal(resolveBuildBase({ BUILD_BASE: `.` }), `./`)
})

test(`keeps the legacy root deployment flag working`, () => {
  assert.equal(resolveBuildBase({ SERVER_ENV: `NETLIFY` }), `/`)
})
