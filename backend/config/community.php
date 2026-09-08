<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Reserved usernames
    |--------------------------------------------------------------------------
    |
    | These can never be used for self-registration, regardless of role.
    |
    */

    'reserved_usernames' => [
        'admin', 'administrator', 'root', 'support', 'staff', 'moderator',
        'fireshark', 'fire-shark', 'system', 'official', 'help', 'about',
    ],

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
