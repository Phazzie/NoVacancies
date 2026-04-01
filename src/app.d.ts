/// <reference types="@sveltejs/kit" />
import type { SessionUser } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			sessionUser: SessionUser | null;
		}
	}
}

export {};
