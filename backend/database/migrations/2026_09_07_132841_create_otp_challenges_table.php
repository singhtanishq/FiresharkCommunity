<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * OTPs are issued for specific purposes (login, signup email verification,
 * password reset verification). They are stored only as a hash; the
 * plaintext is sent through ZeptoMail and never persisted.
 *
 * The challenge is identified by a public, opaque token; the OTP itself is
 * a 6-digit code. Multiple failed attempts lock the challenge for a
 * configurable cool-down. Old OTPs are invalidated when a new one is
 * issued for the same (purpose, identifier) pair.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_challenges', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique();
            $table->string('purpose', 40)->index(); // login | signup_email | password_reset
            $table->string('identifier', 191)->index(); // email or username, lowercased
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->unsignedTinyInteger('max_attempts')->default(5);
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamp('locked_until')->nullable();
            $table->ipAddress('ip')->nullable();
            $table->string('user_agent', 191)->nullable();
            $table->timestamps();

            $table->index(['purpose', 'identifier']);
            $table->index(['purpose', 'identifier', 'consumed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_challenges');
    }
};
