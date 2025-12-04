<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'name_customers' => $this['name_customers'],
            'date_request'   => $this['date_request'],
            'token'          => $this['token'],
            'exp'            => $this['exp'],
        ];
    }
}
