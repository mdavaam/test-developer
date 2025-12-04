<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MasterCustomerController;
use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;


//nomor 2
Route::get('/master-customers', [MasterCustomerController::class, 'index']);

//nomor 3
Route::post('/generate-token', [AuthController::class, 'generateToken']);

//nomor 4
Route::post('/orders', [OrderController::class, 'store'])
    ->middleware('auth:api');
