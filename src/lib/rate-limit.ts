/**
 * In-memory rate limiter for API routes.
 * Tracks requests per IP with a sliding window.
 * No external dependencies — resets on server restart.
 */

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of store) {
		if (now > entry.resetTime) {
			store.delete(key);
		}
	}
}, 5 * 60 * 1000);

interface RateLimitConfig {
	/** Max requests per window (default: 10) */
	maxRequests?: number;
	/** Window duration in seconds (default: 60) */
	windowSeconds?: number;
}

interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetIn: number;
}

/**
 * Check if a request is within rate limits.
 * Returns headers-compatible info for the response.
 */
export function checkRateLimit(
	ip: string,
	config: RateLimitConfig = {}
): RateLimitResult {
	const { maxRequests = 10, windowSeconds = 60 } = config;
	const now = Date.now();
	const key = ip;
	const entry = store.get(key);

	if (!entry || now > entry.resetTime) {
		store.set(key, { count: 1, resetTime: now + windowSeconds * 1000 });
		return { allowed: true, remaining: maxRequests - 1, resetIn: windowSeconds };
	}

	entry.count += 1;

	if (entry.count > maxRequests) {
		const resetIn = Math.ceil((entry.resetTime - now) / 1000);
		return { allowed: false, remaining: 0, resetIn };
	}

	return {
		allowed: true,
		remaining: maxRequests - entry.count,
		resetIn: Math.ceil((entry.resetTime - now) / 1000),
	};
}

/**
 * Returns a 429 Response if rate limited, or null if allowed.
 * Use at the top of any API route handler.
 */
export function rateLimitResponse(request: Request): Response | null {
	const forwarded = request.headers.get('x-forwarded-for');
	const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

	const result = checkRateLimit(ip, { maxRequests: 10, windowSeconds: 60 });

	if (!result.allowed) {
		return Response.json(
			{ error: `Rate limited — try again in ${result.resetIn}s` },
			{
				status: 429,
				headers: {
					'Retry-After': String(result.resetIn),
					'X-RateLimit-Remaining': '0',
				},
			}
		);
	}

	return null;
}
