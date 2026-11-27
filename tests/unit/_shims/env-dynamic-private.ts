// Unit-test stand-in for SvelteKit's `$env/dynamic/private`. Reads process.env live so
// tests can set variables per case.
export const env: Record<string, string | undefined> = new Proxy(
    {},
    { get: (_target, key: string) => process.env[key] }
);
