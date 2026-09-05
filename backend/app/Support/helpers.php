<?php

use Illuminate\Support\Str;

if (! function_exists('str_limit_excerpt')) {
    /**
     * Plain-text excerpt from markdown content, used in question cards and
     * search results.
     */
    function str_limit_excerpt(string $markdown, int $limit = 240): string
    {
        $text = preg_replace('/```.*?```/s', ' [code] ', $markdown);
        $text = preg_replace('/`([^`]+)`/', '$1', (string) $text);
        $text = preg_replace('/!\[([^\]]*)\]\([^)]*\)/', '$1', (string) $text);
        $text = preg_replace('/\[([^\]]+)\]\([^)]*\)/', '$1', (string) $text);
        $text = preg_replace('/^#{1,6}\s+/m', '', (string) $text);
        $text = str_replace(['*', '_', '>', '#'], '', (string) $text);
        $text = trim(preg_replace('/\s+/', ' ', (string) $text) ?? '');

        return Str::limit($text, $limit);
    }
}

if (! function_exists('attachment_url')) {
    /**
     * Build an absolute URL for a stored file path.
     */
    function attachment_url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return asset('storage/'.$path);
    }
}
