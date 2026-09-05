<?php

namespace App\Enums;

enum VerificationType: string
{
    case Team = 'team';
    case Instructor = 'instructor';
    case Expert = 'expert';
    case Alumni = 'alumni';
    case Professional = 'professional';
}
