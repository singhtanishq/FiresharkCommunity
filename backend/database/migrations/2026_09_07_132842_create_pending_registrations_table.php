<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pending registrations hold the verified name/username/email/avatar/password
 * hash between successful email verification and account creation. The actual
 * user row is only inserted once the full signup flow completes, so abandoned
 * registrations do not pollute the user table.
 *
 * Password is stored with bcrypt so an abandoned pending record cannot leak a
 * plaintext password if the database is exposed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pending_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60);
            $table->string('username', 30)->unique();
            $table->string('email', 191)->unique();
            $table->string('password_hash');
            $table->ipAddress('signup_ip')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pending_registrations');
    }
};
