// Shared test utilities for server tests
// This module stubs authentication/authority middleware and exposes a function
// to create an express app that mounts the policies router.

// Stub middlewares at module load time so routes import will see the mocks
jest.mock('../middleware/authenticate', () => ({ authenticate: (req: any, res: any, next: any) => next() }));
jest.mock('../middleware/verifyAuthority', () => ({ verifyAuthority: (req: any, res: any, next: any) => next() }));

import express from 'express';

export function createApp() {
  const app = express();
  app.use(express.json());
  // require the router after middleware mocks are applied
  const policiesRouter = require('../modules/policies/policy.routes').default;
  app.use('/policies', policiesRouter);
  return app;
}
