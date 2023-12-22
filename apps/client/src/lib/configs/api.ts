import { contracts } from '@myorg/api-client';
import { initQueryClient } from '@ts-rest/react-query';

export const api = initQueryClient(contracts, {
  baseUrl: 'http://localhost:3000/api',
  credentials: 'include',
  baseHeaders: {},
});
