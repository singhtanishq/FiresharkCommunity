<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;

class VerifyEmailController extends Controller
{
    use ApiResponse;

    /**
     * Completes email verification from the signed link the SPA forwards
     * after the user clicks it. Laravel's EmailVerificationRequest performs
     * the signature, hash and expiry checks before this method runs.
     */
    public function __invoke(EmailVerificationRequest $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return $this->success(null, 'Email already verified.');
        }

        $request->fulfill();

        event(new Verified($user));

        return $this->success(null, 'Your email address has been verified.');
    }

    public function resend(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return $this->success(null, 'Email already verified.');
        }

        $user->sendEmailVerificationNotification();

        return $this->success(null, 'Verification link sent. Check your inbox.');
    }
}
