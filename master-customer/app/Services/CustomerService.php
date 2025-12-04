<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class CustomerService
{
    public function getRandomUsers()
    {
        $response = Http::get("https://randomuser.me/api/?results=10&page=1");

        $json = $response->json();

        return collect($json['results'])->map(function($u) {
            return [
                "name" => $u["name"]["title"] . " " . $u["name"]["first"] . " " . $u["name"]["last"],
                "email" => $u["email"],
                "uuid" => $u["login"]["uuid"],
                "username" => $u["login"]["username"],
                "password" => $u["login"]["password"],
                "phone" => $u["phone"],
                "cell" => $u["cell"],
                "picture" => $u["picture"]["medium"],
            ];
        });
    }
}

?>
