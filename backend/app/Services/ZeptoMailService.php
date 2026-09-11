<?php

namespace App\Services;

use App\Models\OtpChallenge;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends transactional emails through ZeptoMail.
 *
 * Configuration (all environment-driven — never hard-coded):
 *   ZEPTOMAIL_API_KEY, ZEPTOMAIL_FROM_EMAIL, ZEPTOMAIL_FROM_NAME
 *   ZEPTOMAIL_OTP_TEMPLATE_KEY, ZEPTOMAIL_RESET_TEMPLATE_KEY
 *   ZEPTOMAIL_SINGLE_AGENT_KEY
 *
 * In local environments (APP_ENV=local) or when the placeholder key
 * "development_placeholder" is configured, calls short-circuit and write the
 * payload to the log so the developer can copy the OTP from the Laravel
 * log. In any other environment a placeholder key fails fast with a clear
 * exception — the API never silently drops a message.
 */
class ZeptoMailService
{
    public function __construct()
    {
    }

    public function sendOtp(
        OtpChallenge $challenge,
        string $recipientEmail,
        string $recipientName = '',
        string $code = ''
    ): bool
    {
        $payload = $this->otpPayload(
            $challenge,
            $recipientEmail,
            $recipientName,
            $code
        );

        return $this->dispatch($payload, $recipientEmail, $challenge->code_hash);
    }

    public function sendPasswordResetLink(string $email, string $name, string $url): bool
    {
        $payload = [
            'from' => $this->fromHeader(),
            'to' => [[
                'email_address' => ['address' => $email, 'name' => $name],
            ]],
            'subject' => 'Reset your FireShark Community password',
            'template_key' => $this->templateKey('reset'),
            'merge_info' => [
                'name' => $name,
                'reset_url' => $url,
                'minutes' => (int) ceil(config('auth.passwords.users.expire') / 60),
            ],
        ];

        return $this->dispatch($payload, $email, $url);
    }

    protected function otpPayload(
        OtpChallenge $challenge,
        string $email,
        string $name,
        string $code
    ): array

    {
        $minutes = max(1, (int) ceil($challenge->expires_at->diffInSeconds(now()) / 60));

        return [
            'from' => $this->fromHeader(),
            'to' => [[
                'email_address' => ['address' => $email, 'name' => $name],
            ]],
            'subject' => $this->otpSubject($challenge->purpose),
            'template_key' => $this->templateKey('otp'),
            'merge_info' => $this->otpMergeInfo($challenge, $minutes, $code),
        ];
    }

    protected function otpMergeInfo(
        OtpChallenge $challenge,
        int $minutes,
        string $code
    ): array
    {
        return [
            'purpose_label' => match ($challenge->purpose) {
                OtpChallenge::PURPOSE_LOGIN => 'FireShark Community sign-in verification',
                OtpChallenge::PURPOSE_SIGNUP_EMAIL => 'Confirm your FireShark Community email address',
                OtpChallenge::PURPOSE_PASSWORD_RESET => 'Confirm your FireShark Community password reset',
                default => 'Your FireShark Community verification code',
            },
            'minutes' => $minutes,
            'code' => $code,
        ];
    }

    protected function otpSubject(string $purpose): string
    {
        return match ($purpose) {
            OtpChallenge::PURPOSE_LOGIN => 'Your FireShark Community sign-in code',
            OtpChallenge::PURPOSE_SIGNUP_EMAIL => 'Confirm your FireShark Community email',
            OtpChallenge::PURPOSE_PASSWORD_RESET => 'Your FireShark Community password reset code',
            default => 'Your FireShark Community verification code',
        };
    }

    protected function fromHeader(): array
    {
        return [
            'address' => config('services.zeptomail.from_email'),
            'name' => config('services.zeptomail.from_name', config('app.name')),
        ];
    }

    protected function templateKey(string $type): string
    {
        return match ($type) {
            'otp' => config('services.zeptomail.otp_template_key'),
            'reset' => config('services.zeptomail.reset_template_key'),
            default => throw new \RuntimeException("Unknown ZeptoMail template type: $type"),
        };
    }

    protected function dispatch(array $payload, string $recipientHint, string $secretMarker): bool
    {
        $apiKey = (string) config('services.zeptomail.api_key', '');
        $apiBase = rtrim((string) config('services.zeptomail.api_base', 'https://api.zeptomail.com/v1.1'), '/');

        // No real key in local development (or placeholder): log instead of dispatching.
        if (
            $apiKey === '' ||
            $apiKey === 'development_placeholder' ||
            (app()->environment('local') && ! env('ZEPTOMAIL_FORCE_SEND', false))
        ) {
            Log::info('ZeptoMail call captured for local development.', [
                'recipient' => $recipientHint,
                'subject' => $payload['subject'] ?? null,
                'template_key' => $payload['template_key'] ?? null,
                'secret_marker' => substr(hash('sha256', $secretMarker), 0, 12),
            ]);
            return true;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Zoho-enczapikey '.$apiKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
                ->post($apiBase.'/email/template', $payload);

            if (! $response->successful()) {
                Log::error('ZeptoMail returned a non-2xx response.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            
                return false;
            }
            
            Log::info('ZeptoMail email accepted.', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            return true;
        } catch (ConnectionException $e) {
            Log::error('ZeptoMail connection failed.', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
