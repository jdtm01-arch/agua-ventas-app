<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class VentaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'cliente_id' => $this->cliente_id,
            'tipo_venta' => $this->tipo_venta,
            'monto' => $this->monto,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('creator', function () {
                return [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                    'email' => $this->creator->email,
                ];
            }),
            'cliente' => new ClienteResource($this->whenLoaded('cliente')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
