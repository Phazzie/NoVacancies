<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<svelte:head>
	<title>Sign in — No Vacancies</title>
	<meta name="description" content="Sign in to access the No Vacancies story builder." />
</svelte:head>

<div class="login-shell">
	<div class="login-card">
		<header class="login-header">
			<p class="login-kicker">No Vacancies / builder access</p>
			<h1 class="login-title">Sign in</h1>
			<p class="login-sub">
				The story builder is a restricted tool. Sign in to continue.
			</p>
		</header>

		{#if form?.error}
			<p class="login-error" role="alert">{form.error}</p>
		{/if}

		{#if data.demoEnabled}
			<form method="POST" action="?/demoSignIn" use:enhance class="login-form">
				<button type="submit" class="login-btn-primary">
					Enter as author (demo mode)
				</button>
			</form>
			<p class="login-notice">
				Demo mode is active. This grants <code>author</code> access without password verification.
				Disable <code>DEMO_AUTH_ENABLED</code> in production.
			</p>
		{:else}
			<div class="login-unavailable">
				<p>
					Full authentication is not yet enabled on this instance. Supabase-backed login
					arrives in a later sprint.
				</p>
				<p class="login-notice">
					To unlock the builder locally, set <code>DEMO_AUTH_ENABLED=1</code> and
					<code>AUTH_SESSION_SECRET</code> in your <code>.env</code>.
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.login-shell {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
	}

	.login-card {
		width: 100%;
		max-width: 420px;
		border: 1px solid var(--color-border, #2a2a2a);
		border-radius: 6px;
		padding: 2.5rem 2rem;
		background: var(--color-surface, #111);
	}

	.login-header {
		margin-bottom: 1.75rem;
	}

	.login-kicker {
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-muted, #666);
		margin: 0 0 0.5rem;
	}

	.login-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		line-height: 1.2;
	}

	.login-sub {
		font-size: 0.875rem;
		color: var(--color-muted, #888);
		margin: 0;
		line-height: 1.5;
	}

	.login-error {
		background: color-mix(in srgb, red 12%, transparent);
		border: 1px solid color-mix(in srgb, red 30%, transparent);
		border-radius: 4px;
		color: #f87171;
		font-size: 0.875rem;
		margin: 0 0 1rem;
		padding: 0.625rem 0.875rem;
	}

	.login-form {
		margin-bottom: 1rem;
	}

	.login-btn-primary {
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		background: var(--color-accent, #e8e8e8);
		color: var(--color-bg, #0a0a0a);
		border: none;
		border-radius: 4px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.login-btn-primary:hover {
		opacity: 0.88;
	}

	.login-btn-primary:active {
		opacity: 0.75;
	}

	.login-notice {
		font-size: 0.75rem;
		color: var(--color-muted, #666);
		line-height: 1.5;
		margin: 0.75rem 0 0;
	}

	.login-notice code {
		font-family: monospace;
		background: var(--color-surface-raised, #1c1c1c);
		padding: 0.1em 0.3em;
		border-radius: 2px;
	}

	.login-unavailable {
		font-size: 0.875rem;
		color: var(--color-muted, #888);
		line-height: 1.6;
	}

	.login-unavailable p {
		margin: 0 0 0.75rem;
	}
</style>
