<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Question;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\Response;

/**
 * Dynamic sitemap.xml covering questions, categories, tags and public
 * profiles. Excludes admin/private/hidden content.
 */
class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $base = rtrim(config('app.url'), '/');

        $entries = collect();

        // Static public pages.
        $entries->push(['loc' => $base.'/', 'lastmod' => null, 'priority' => '1.0']);
        $entries->push(['loc' => $base.'/questions', 'lastmod' => null, 'priority' => '0.9']);
        $entries->push(['loc' => $base.'/categories', 'lastmod' => null, 'priority' => '0.7']);
        $entries->push(['loc' => $base.'/tags', 'lastmod' => null, 'priority' => '0.6']);
        $entries->push(['loc' => $base.'/leaderboard', 'lastmod' => null, 'priority' => '0.6']);
        $entries->push(['loc' => $base.'/community-guidelines', 'lastmod' => null, 'priority' => '0.4']);
        $entries->push(['loc' => $base.'/about', 'lastmod' => null, 'priority' => '0.4']);

        Question::query()
            ->publiclyVisible()
            ->select('slug', 'updated_at', 'created_at')
            ->latest('updated_at')
            ->limit(50000)
            ->get()
            ->each(fn ($q) => $entries->push([
                'loc' => $base."/questions/{$q->slug}",
                'lastmod' => ($q->updated_at ?? $q->created_at)?->toAtomString(),
                'priority' => '0.8',
            ]));

        Category::query()->where('is_active', true)
            ->get(['slug', 'updated_at'])
            ->each(fn ($c) => $entries->push([
                'loc' => $base."/categories/{$c->slug}",
                'lastmod' => $c->updated_at?->toAtomString(),
                'priority' => '0.7',
            ]));

        Tag::query()->where('questions_count', '>', 0)
            ->orderByDesc('questions_count')
            ->limit(5000)
            ->get(['slug', 'updated_at'])
            ->each(fn ($t) => $entries->push([
                'loc' => $base."/tags/{$t->slug}",
                'lastmod' => $t->updated_at?->toAtomString(),
                'priority' => '0.6',
            ]));

        User::query()
            ->notSuspended()
            ->where('email_verified_at', '!=', null)
            ->orderByDesc('reputation')
            ->limit(5000)
            ->get(['username'])
            ->each(fn ($u) => $entries->push([
                'loc' => $base."/users/{$u->username}",
                'lastmod' => null,
                'priority' => '0.5',
            ]));

        $xml = view('sitemap', ['entries' => $entries])->render();

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }
}
