<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Image uploads for question/answer bodies. Files are validated by MIME and
 * size, resized down to a sane width with GD, stored under a random name and
 * tracked in the media table so moderators can remove them later.
 */
class MediaController extends Controller
{
    use ApiResponse;

    public function store(Request $request): JsonResponse
    {
        $maxSize = config('community.images.max_size');

        $request->validate([
            'image' => [
                'required',
                'image',
                'mimes:png,jpg,jpeg,webp',
                'max:'.$maxSize,
                'dimensions:min_width=50,min_height=50,max_width=6000,max_height=6000',
            ],
        ]);

        $file = $request->file('image');
        $user = $request->user();

        $image = @imagecreatefromstring(file_get_contents($file->getRealPath()));

        if ($image === false) {
            return $this->error('The uploaded file could not be processed as an image.', 422);
        }

        $maxWidth = config('community.images.max_width');
        $width = imagesx($image);
        $height = imagesy($image);

        if ($width > $maxWidth) {
            $newHeight = (int) round($height * ($maxWidth / $width));
            $resized = imagecreatetruecolor($maxWidth, $newHeight);

            if (in_array($file->getMimeType(), ['image/png', 'image/webp'], true)) {
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
            }

            imagecopyresampled($resized, $image, 0, 0, 0, 0, $maxWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resized;
            $width = $maxWidth;
            $height = $newHeight;
        }

        $extension = match ($file->getMimeType()) {
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => 'jpg',
        };

        $path = sprintf('media/%s/%s.%s', now()->format('Y/m'), Str::random(40), $extension);

        $disk = Storage::disk('public');
        $disk->makeDirectory(dirname($path));

        $stream = fopen('php://temp/maxmemory:104857600', 'r+');

        switch ($extension) {
            case 'png': imagepng($image, $stream, 8); break;
            case 'webp': imagewebp($image, $stream, 82); break;
            default: imagejpeg($image, $stream, 82); break;
        }

        rewind($stream);
        $disk->put($path, $stream);
        fclose($stream);
        imagedestroy($image);

        $size = (int) $disk->size($path);

        $media = Media::create([
            'user_id' => $user->id,
            'path' => $path,
            'disk' => 'public',
            'mime_type' => $file->getMimeType(),
            'size' => $size,
            'original_name' => $file->getClientOriginalName(),
            'width' => $width,
            'height' => $height,
            'created_at' => now(),
        ]);

        return $this->success([
            'id' => $media->id,
            'url' => $media->url,
            'width' => $width,
            'height' => $height,
            'size' => $size,
        ], 'Image uploaded.', 201);
    }
}
