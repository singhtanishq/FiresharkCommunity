<?php

namespace App\Support;

/**
 * Reads the Vite production build manifest so the SPA shell can reference
 * hashed asset files. In production the compiled React application lives in
 * public/build and is served by Laravel — no Node runtime required.
 */
class ViteManifest
{
    public static function assets(): ?array
    {
        $manifestPath = public_path('build/.vite/manifest.json');

        if (! is_file($manifestPath)) {
            return null;
        }

        $manifest = json_decode((string) file_get_contents($manifestPath), true);

        $entry = collect($manifest)->first(fn ($chunk) => ($chunk['isEntry'] ?? false) === true);

        if (! $entry || empty($entry['file'])) {
            return null;
        }

        return [
            'js' => asset('build/'.$entry['file']),
            'css' => collect($entry['css'] ?? [])
                ->map(fn ($file) => asset('build/'.$file))
                ->all(),
        ];
    }
}
