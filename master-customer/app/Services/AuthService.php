<?php

namespace App\Services;

use Tymon\JWTAuth\Facades\JWTFactory;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
    public function generateToken(array $data)
    {
        
        $factory = JWTFactory::customClaims([
            'name_customers' => $data['name_customers'],
            'date_request'   => $data['date_request'],
            'sub'            => 1,
        ]);

        $payload = $factory->make();
        $token = JWTAuth::encode($payload)->get();

        return [
            'name_customers' => $data['name_customers'],
            'date_request'   => $data['date_request'],
            'token'          => $token,
            'exp'            => $payload->get('exp'),
        ];
    }
}
