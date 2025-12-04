<?php

namespace App\Http\Controllers;

use App\Http\Requests\AuthRequest;
use App\Http\Resources\AuthResource;
use App\Services\AuthService;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function generateToken(AuthRequest $request)
    {
        try {
            $data = $request->validated();

            $result = $this->authService->generateToken($data);

            return new AuthResource($result);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal generate token',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
