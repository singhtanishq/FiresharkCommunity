<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ $seo['title'] }}</title>
    <meta name="description" content="{{ $seo['description'] }}">
    <link rel="canonical" href="{{ $seo['canonical'] }}">

    @if(!empty($noindex))
        <meta name="robots" content="noindex, nofollow">
    @else
        <meta name="robots" content="index, follow">
    @endif

    {{-- Open Graph --}}
    <meta property="og:site_name" content="FireShark Community">
    <meta property="og:title" content="{{ $seo['title'] }}">
    <meta property="og:description" content="{{ $seo['description'] }}">
    <meta property="og:type" content="{{ $seo['og_type'] ?? 'website' }}">
    <meta property="og:url" content="{{ $seo['canonical'] }}">

    {{-- Twitter / X --}}
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{{ $seo['title'] }}">
    <meta name="twitter:description" content="{{ $seo['description'] }}">

    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <meta name="theme-color" content="#0b1220">

    @if(!empty($seo['json_ld']))
        <script type="application/ld+json">{!! $seo['json_ld'] !!}</script>
    @endif

    @if(!empty($assets))
        @foreach($assets['css'] as $css)
            <link rel="stylesheet" href="{{ $css }}">
        @endforeach
    @endif
</head>
<body>
    <div id="root"></div>

    @if(!empty($assets))
        <script type="module" src="{{ $assets['js'] }}"></script>
    @else
        {{-- No production build present. During development the SPA runs on
             the Vite dev server (npm run dev in ../frontend). --}}
        <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 40rem; margin: 0 auto;">
            <h1>FireShark Community</h1>
            <p>The API is running. The compiled frontend is not deployed in this environment yet.</p>
            <p>During development, open <a href="http://localhost:5173">http://localhost:5173</a> (Vite dev server).</p>
        </div>
    @endif
</body>
</html>
