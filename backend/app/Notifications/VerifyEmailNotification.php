<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

/**
 * Builds the signed verification parameters and hands them to the React
 * frontend, which completes verification by calling the API endpoint with
 * the same parameters. Keeps the SPA in charge of presentation while the
 * signed URL keeps the flow tamper-proof.
 */
class VerifyEmailNotification extends VerifyEmail
{
    protected function verificationUrl($notifiable): string
    {
        $signedUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        // Signed URL looks like:
        // {api}/auth/email/verify/{id}/{hash}?expires=...&signature=...
        $path = parse_url($signedUrl, PHP_URL_PATH) ?? '';
        $query = parse_url($signedUrl, PHP_URL_QUERY) ?? '';

        // /api prefix is stripped; the SPA route keeps the id/hash segments.
        $spaPath = '/verify-email'.str_replace('/api', '', $path);

        return rtrim(config('community.frontend_url'), '/').$spaPath.($query ? '?'.$query : '');
    }
}
