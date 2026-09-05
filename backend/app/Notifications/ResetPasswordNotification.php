<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Config;

/**
 * Points the password-reset link at the React frontend. The SPA forwards
 * the token and email to the API reset endpoint.
 */
class ResetPasswordNotification extends ResetPassword
{
    protected function resetUrl($notifiable): string
    {
        if (static::$createUrlCallback) {
            return call_user_func(static::$createUrlCallback, $notifiable, $this->token);
        }

        return rtrim(config('community.frontend_url'), '/')
            .'/reset-password?token='.$this->token
            .'&email='.urlencode($notifiable->getEmailForPasswordReset());
    }
}
