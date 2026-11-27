// Unit-test stand-in for SvelteKit's `$app/environment` virtual module.
export const browser = false;
export const dev = process.env.NODE_ENV !== 'production';
export const building = false;
export const version = 'test';
