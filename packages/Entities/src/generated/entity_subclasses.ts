export const loadModule = () => {
  // no-op — importing this barrel loads every per-schema module via the re-exports below
}

export * from './entities/morecheese_events.js';
export * from './entities/morecheese_learning.js';
export * from './entities/morecheese_members.js';
