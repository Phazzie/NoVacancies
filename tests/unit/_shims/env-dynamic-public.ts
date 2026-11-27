// Unit-test stand-in for SvelteKit's `$env/dynamic/public`.
export const env: Record<string, string | undefined> = new Proxy(
	{},
	{ get: (_target, key: string) => process.env[key] }
);
