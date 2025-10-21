// Mute console during tests to reduce noise; allow enabling with DEBUG_CONSOLE env var
if (!process.env.DEBUG_CONSOLE) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noop = () => {};
  console.log = noop as any;
  console.info = noop as any;
  console.warn = noop as any;
  console.error = noop as any;
}
