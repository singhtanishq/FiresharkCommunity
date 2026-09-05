<?php

namespace App\Enums;

enum ReportReason: string
{
    case Spam = 'spam';
    case Abuse = 'abuse';
    case PersonalInformation = 'personal_information';
    case MaliciousContent = 'malicious_content';
    case OffTopic = 'off_topic';
    case Duplicate = 'duplicate';
    case Misleading = 'misleading';
    case Copyright = 'copyright';
    case Other = 'other';
}
