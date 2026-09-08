<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\OtpChallenge;
use App\Models\PendingRegistration;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Direct email-link verification has been replaced by the OTP-based
 * signup flow. The original Laravel signed-link verify route is kept as
 * a fallback so already-sent verification emails from previous installs
 * still resolve, but new registrations always go through the OTP stage.
 */
class VerifyEmailController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request, int $id, string $hash): JsonResponse
    {
        $user = User::query()->find($id);
        if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return $this->error('Invalid or expired verification link.', 410);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return $this->success(null, 'Your email address has been verified.');
    }
}
