<?php

use App\Http\Controllers\SitemapController;
use App\Http\Controllers\SpaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes — SEO layer + compiled React SPA
|--------------------------------------------------------------------------
|
| In production the compiled React build is served from public/build and
| Laravel renders the SPA shell with server-injected metadata. SEO-critical
| paths have dedicated routes that resolve the entity server-side.
|
*/

Route::get('/', [SpaController::class, 'home'])->name('spa.home');

// SEO-resolved routes (server-side meta + QAPage structured data).
Route::get('/questions/{slug}', [SpaController::class, 'question'])->where('slug', '.*')->name('spa.question');
Route::get('/categories/{slug}', [SpaController::class, 'category'])->name('spa.category');
Route::get('/tags/{slug}', [SpaController::class, 'tag'])->name('spa.tag');
Route::get('/users/{username}', [SpaController::class, 'user'])->name('spa.user');

Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');

// Every other SPA route.
Route::fallback([SpaController::class, 'fallback'])->name('spa.fallback');
