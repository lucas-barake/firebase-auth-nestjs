import { initContract } from '@ts-rest/core';
import { authContract } from './lib/api-contracts';

export * from './lib/api-contracts';

const c = initContract();

export const contracts = c.router({
  auth: authContract,
});
