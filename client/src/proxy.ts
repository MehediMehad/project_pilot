import jwt, { JwtPayload } from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getDefaultDashboardRoute, getRouteOwner, isAuthRoute, UserRole } from './lib/auth/auth-utils';
import { getNewAccessToken } from './services/auth/auth.service';
import { deleteCookie, getCookie } from './services/auth/token-handlers.service';

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const hasTokenRefreshedParam = request.nextUrl.searchParams.has('tokenRefreshed');

    // If coming back after token refresh, remove the param and continue
    if (hasTokenRefreshedParam) {
        const url = request.nextUrl.clone();
        url.searchParams.delete('tokenRefreshed');
        return NextResponse.redirect(url);
    }

    const tokenRefreshResult = await getNewAccessToken();

    // If token was refreshed, redirect to same page to fetch with new token
    if (tokenRefreshResult?.tokenRefreshed) {
        const url = request.nextUrl.clone();
        url.searchParams.set('tokenRefreshed', 'true');
        return NextResponse.redirect(url);
    }

    const accessToken = await getCookie("accessToken") || null;

    let userRole: UserRole | null = null;

    if (accessToken) {
        try {
            const verifiedToken: JwtPayload | string = jwt.verify(
                accessToken,
                process.env.JWT_SECRET as string
            );

            if (typeof verifiedToken === "string") {
                await deleteCookie("accessToken");
                await deleteCookie("refreshToken");

                return NextResponse.redirect(
                    new URL("/login", request.url)
                );
            }

            userRole = verifiedToken.role as UserRole;

        } catch (error) {
            console.error("Error verifying token:", error);
            await deleteCookie("accessToken");
            await deleteCookie("refreshToken");

            return NextResponse.redirect(
                new URL("/login", request.url)
            );
        }
    }

    const routerOwner = getRouteOwner(pathname);
    const isAuth = isAuthRoute(pathname);

    // Rule 1 : User is logged in and trying to access auth route. Redirect to default dashboard
    if (accessToken && isAuth) {
        return NextResponse.redirect(new URL(getDefaultDashboardRoute(userRole as UserRole), request.url));
    }

    // Rule 2 : User is trying to access open public route
    if (routerOwner === null) {
        return NextResponse.next();
    }

    if (!accessToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Rule 3 : User is trying to access common protected route
    if (routerOwner === "COMMON") {
        return NextResponse.next();
    }

    // Rule 4 : User is trying to access role based protected route
    if (routerOwner === "ADMIN" || routerOwner === "PROJECT_MANAGER" || routerOwner === "TEAM_MEMBER") {
        if (userRole !== routerOwner) {
            return NextResponse.redirect(new URL(getDefaultDashboardRoute(userRole as UserRole), request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.well-known).*)',
    ],
}