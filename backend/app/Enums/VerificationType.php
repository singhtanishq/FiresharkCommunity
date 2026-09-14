<?php

namespace App\Enums;

enum VerificationType: string
{
    case Team = 'team';
    case Expert = 'expert';
    case Alumni = 'alumni';
    case Professional = 'professional';
}
