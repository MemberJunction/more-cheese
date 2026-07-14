/**
 * @mj-more-cheese-demo/server — the SERVER BOOTSTRAP package.
 *
 * This is the package named in mj-app.json under packages.server with role
 * "bootstrap". At startup MJAPI dynamically imports it and calls the function
 * named by "startupExport" (LoadMoreCheeseDemoServer below). The static
 * imports in this file — evaluated when MJAPI imports the package — fire
 * every @RegisterClass decorator in this app's server-side packages, which is
 * how MJ discovers the entities, actions, and GraphQL resolvers.
 *
 * WHAT LIVES HERE
 *   src/generated/  — CodeGen GraphQLServer output (resolvers; do not edit)
 *   src/            — hand-written resolvers / engines / providers
 *
 * Pattern mirrors bizapps-common's Server bootstrap.
 */

// Import entity and action packages to trigger @RegisterClass decorators
import '@mj-more-cheese-demo/entities';
import '@mj-more-cheese-demo/actions';

// Server-side entity subclasses — must come after the entities package so
// @RegisterClass auto-increment gives these higher priority
import '@mj-more-cheese-demo/core-entities-server';

// Import generated GraphQL resolvers (registers them with type-graphql)
import './generated/generated.js';

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** Absolute paths to the generated resolver files, for use with createMJServer() */
export const RESOLVER_PATHS = [resolve(__dirname, 'generated/generated.{js,ts}')];

/**
 * Bootstrap function called by DynamicPackageLoader during MJAPI startup.
 * The static imports above handle all registration; this function ensures
 * the module is fully evaluated.
 */
export function LoadMoreCheeseDemoServer(): void {
    // Static imports above ensure all classes are registered.
    // This function exists as the startupExport entry point for DynamicPackageLoader.
}
