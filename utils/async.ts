/**
 * Yields execution to the event loop, allowing UI updates or other tasks to run.
 * Useful for breaking up long-running synchronous tasks in React Native.
 */
export const yieldToEventLoop = (): Promise<void> =>
    new Promise(resolve => setTimeout(() => resolve(), 0));
