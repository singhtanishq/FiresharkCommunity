<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Email verification
    |--------------------------------------------------------------------------
    |
    | When enabled, users must verify their email address before asking,
    | answering, voting or commenting. Set REQUIRE_EMAIL_VERIFICATION=false
    | only if outgoing mail is not yet configured at launch.
    |
    */

    'require_email_verification' => env('REQUIRE_EMAIL_VERIFICATION', true),

    /*
    |--------------------------------------------------------------------------
    | Frontend origin
    |--------------------------------------------------------------------------
    |
    | Absolute URL of the React application. In production the compiled SPA
    | is served by Laravel itself, so this equals APP_URL. During local
    | development it is the Vite dev server.
    |
    */

    'frontend_url' => env('FRONTEND_URL', env('APP_URL', 'http://localhost:5173')),

    /*
    |--------------------------------------------------------------------------
    | Content limits
    |--------------------------------------------------------------------------
    */

    'images' => [
        'max_size' => 5 * 1024, // KB per uploaded image
        'max_width' => 1600,
        'allowed_mimes' => ['image/png', 'image/jpeg', 'image/webp'],
    ],

    'search' => [
        'min_term_length' => 2,
    ],
];
