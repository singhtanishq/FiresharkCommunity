<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'zeptomail' => [
        'api_key' => env('ZEPTOMAIL_API_KEY', 'development_placeholder'),
        'api_base' => env('ZEPTOMAIL_API_BASE', 'https://api.zeptomail.com/v1.1'),
        'from_email' => env('ZEPTOMAIL_FROM_EMAIL', 'community@fireshark.in'),
        'from_name' => env('ZEPTOMAIL_FROM_NAME', 'FireShark Community'),
        'otp_template_key' => env('ZEPTOMAIL_OTP_TEMPLATE_KEY', 'fire-shark-otp-template'),
        'reset_template_key' => env('ZEPTOMAIL_RESET_TEMPLATE_KEY', 'fire-shark-reset-template'),
    ],

];
