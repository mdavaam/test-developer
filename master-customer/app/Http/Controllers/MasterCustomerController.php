<?php

namespace App\Http\Controllers;

use App\Http\Resources\MasterCustomerResource;
use App\Services\CustomerService;
use Illuminate\Http\Request;

class MasterCustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(CustomerService $service)
    {
        $data = $service->getRandomUsers();
        return MasterCustomerResource::collection($data);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
