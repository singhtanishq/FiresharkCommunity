<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Services\SeoService;
use App\Support\ViteManifest;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

/**
 * Serves the compiled React SPA with server-injected SEO metadata.
 *
 * Public, SEO-relevant routes (/questions/{slug}, /categories/{slug}, ...)
 * pass through dedicated methods that resolve the entity and build meta
 * tags + QAPage JSON-LD server-side. All other SPA routes fall back to the
 * default shell.
 */
class SpaController extends Controller
{
    public function __construct(protected SeoService $seo)
    {
    }

    public function home()
    {
        return $this->render(
            $this->seo->forPage(
                'FireShark Community — Ask. Answer. Learn.',
                SeoService::DEFAULT_DESCRIPTION,
                '/',
            )
        );
    }

    public function question(Request $request, string $slug)
    {
        $question = Question::query()
            ->publiclyVisible()
            ->where('slug', $slug)
            ->first();

        if (! $question) {
            return $this->notFound();
        }

        return $this->render($this->seo->forQuestion($question));
    }

    public function category(string $slug)
    {
        $category = \App\Models\Category::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $category) {
            return $this->notFound();
        }

        return $this->render($this->seo->forCategory($category));
    }

    public function tag(string $slug)
    {
        $tag = \App\Models\Tag::query()->where('slug', $slug)->first();

        if (! $tag) {
            return $this->notFound();
        }

        return $this->render($this->seo->forTag($tag));
    }

    public function user(string $username)
    {
        $user = \App\Models\User::query()->where('username', mb_strtolower($username))->first();

        if (! $user) {
            return $this->notFound();
        }

        return $this->render($this->seo->forUser($user));
    }

    /**
     * Catch-all for every other SPA route (auth pages, settings, admin...).
     * Private pages get noindex so search engines stay out.
     */
    public function fallback(Request $request): View
    {
        $noIndex = [
            '/login', '/register', '/forgot-password', '/reset-password',
            '/settings', '/notifications', '/bookmarks', '/admin',
            '/verify-email', '/ask',
        ];

        $path = '/'.ltrim($request->path(), '/');

        $isPrivate = collect($noIndex)->contains(fn ($prefix) => str_starts_with($path, $prefix));

        return $this->render(
            $this->seo->forPage('FireShark Community', SeoService::DEFAULT_DESCRIPTION, $path),
            noIndex: $isPrivate,
        );
    }

    protected function notFound(): \Illuminate\Http\Response
    {
        return response()
            ->view('spa', ['seo' => [
                'title' => 'Page not found — '.SeoService::SITE_NAME,
                'description' => 'The page you requested could not be found.',
                'canonical' => rtrim(config('app.url'), '/').'/404',
                'og_type' => 'website',
            ], 'assets' => ViteManifest::assets(), 'noindex' => true], 404);
    }

    protected function render(array $seo, bool $noIndex = false): View
    {
        return view('spa', [
            'seo' => $seo,
            'assets' => ViteManifest::assets(),
            'noindex' => $noIndex,
        ]);
    }
}
