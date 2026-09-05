<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

trait ApiResponse
{
    protected function success(mixed $data = null, string $message = 'OK', int $status = 200): JsonResponse
    {
        $payload = [
            'success' => true,
            'message' => $message,
        ];

        if ($data instanceof LengthAwarePaginator) {
            $payload['data'] = $data->items();
            $payload['meta'] = [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
            ];
        } elseif ($data instanceof JsonResource) {
            $payload['data'] = $data->resolve();
        } else {
            $payload['data'] = $data;
        }

        return response()->json($payload, $status);
    }

    protected function paginated(LengthAwarePaginator $paginator, ?string $resourceClass = null, string $message = 'OK'): JsonResponse
    {
        $items = $paginator->items();

        if ($resourceClass !== null) {
            $items = $resourceClass::collection(collect($items))->resolve();
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    protected function error(string $message, int $status = 400, array $errors = []): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors ?: null,
        ], $status);
    }
}
