(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__8303d0ee._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/SemesterV/DebugMiddleware/lib/supabase/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isSupabaseConfigured",
    ()=>isSupabaseConfigured,
    "updateSession",
    ()=>updateSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$SemesterV$2f$DebugMiddleware$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/SemesterV/DebugMiddleware/node_modules/@supabase/ssr/dist/module/index.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$SemesterV$2f$DebugMiddleware$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SemesterV/DebugMiddleware/node_modules/@supabase/ssr/dist/module/createServerClient.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SemesterV$2f$DebugMiddleware$2f$debug$2d$middleware$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/SemesterV/DebugMiddleware/debug-middleware/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$SemesterV$2f$DebugMiddleware$2f$debug$2d$middleware$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SemesterV/DebugMiddleware/debug-middleware/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
;
;
const isSupabaseConfigured = typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" && process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 && typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;
async function updateSession(request) {
    // If Supabase is not configured, just continue without auth
    if (!isSupabaseConfigured) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$SemesterV$2f$DebugMiddleware$2f$debug$2d$middleware$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    let supabaseResponse = __TURBOPACK__imported__module__$5b$project$5d2f$SemesterV$2f$DebugMiddleware$2f$debug$2d$middleware$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
        request
    });
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SemesterV$2f$DebugMiddleware$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["createServerClient"])(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
            cookies: {
                getAll () {
                    return request.cookies.getAll();
                },
                setAll (cookiesToSet) {
                    supabaseResponse = __TURBOPACK__imported__module__$5b$project$5d2f$SemesterV$2f$DebugMiddleware$2f$debug$2d$middleware$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
                        request: {
                            headers: request.headers
                        }
                    });
                    cookiesToSet.forEach(({ name, value, options })=>supabaseResponse.cookies.set(name, value, options));
                }
            }
        });
        // IMPORTANT: DO NOT REMOVE auth.getUser()
        // This call refreshes expired Auth tokens and stores them in cookies
        await supabase.auth.getUser();
    } catch (error) {
        // If there's an error refreshing the session, log it but continue
        console.error('Error updating session:', error);
    // Return the response even if session refresh failed
    }
    return supabaseResponse;
}
}),
"[project]/SemesterV/DebugMiddleware/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$SemesterV$2f$DebugMiddleware$2f$lib$2f$supabase$2f$middleware$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SemesterV/DebugMiddleware/lib/supabase/middleware.ts [middleware-edge] (ecmascript)");
;
async function middleware(request) {
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$SemesterV$2f$DebugMiddleware$2f$lib$2f$supabase$2f$middleware$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["updateSession"])(request);
}
const config = {
    matcher: [
        /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */ '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__8303d0ee._.js.map