<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MasterCustomerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {

        return [
            "name" => $this["name"],
            "email" => $this["email"],
            "uuid" => $this["uuid"],
            "username" => $this["username"],
            "password" => $this["password"],
            "phone" => $this["phone"],
            "cell" => $this["cell"],
            "picture" => $this["picture"],

        ];
    }
}
