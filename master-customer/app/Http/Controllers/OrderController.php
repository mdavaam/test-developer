<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrderRequest;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function store(OrderRequest $request)
    {
        try {
            $data = $request->validated();


            $result = DB::table('users')
                ->join('masteritems', 'users.id', '=', 'masteritems.idname')  // ← UBAH KE 'users'
                ->select(
                    'users.name as name_customers',
                    'masteritems.items',
                    'masteritems.estimateprice',
                    DB::raw("
                        CASE
                            WHEN estimateprice <= 50000 THEN 0.02
                            WHEN estimateprice > 50000 AND estimateprice <= 1500000 THEN 0.035
                            WHEN estimateprice > 1500000 THEN 0.05
                        END as discount
                    "),
                    DB::raw("
                        CAST(estimateprice - (estimateprice *
                        CASE
                            WHEN estimateprice <= 50000 THEN 0.02
                            WHEN estimateprice > 50000 AND estimateprice <= 1500000 THEN 0.035
                            WHEN estimateprice > 1500000 THEN 0.05
                        END) AS UNSIGNED) as fix_price
                    ")
                )
                ->where('users.name', $data['name_customers'])
                ->get();

            if ($result->isEmpty()) {
                return response()->json([
                    'message' => 'Data tidak ditemukan untuk customer: ' . $data['name_customers']
                ], 404);
            }

            $transformed = OrderResource::collection($result);

            return response()->json([
                'result' => $transformed
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal retrieve order',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
