<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'name_customers' => $this->name_customers,
            'items'          => $this->items,
            'discount'       => number_format($this->discount, 3),
            'fix_price'      => (int) $this->fix_price,
        ];
    }
}
