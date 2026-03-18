<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Integration;
use App\Models\Message;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $userId = $request->user()->id;
        $cacheKey = "user_stats_{$userId}";

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($userId) {
            // 1. Connected Numbers
            $connectedNumbers = Integration::where('user_id', $userId)
                ->where('type', 'wa_sender')
                ->count();

            // 2. Total Contacts
            $totalContacts = Contact::where('user_id', $userId)->count();

            // 3. Message Status (Current Month)
            $startOfMonth = Carbon::now()->startOfMonth();
            
            $statusCounts = Message::whereHas('conversation', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->where('sender', 'user')
                ->where('created_at', '>=', $startOfMonth)
                ->select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status')
                ->toArray();

            $totalSentThisMonth = array_sum($statusCounts);
            $deliveredCount = ($statusCounts['delivered'] ?? 0) + ($statusCounts['read'] ?? 0);
            $failedCount = $statusCounts['failed'] ?? 0;
            $pendingCount = ($statusCounts['pending'] ?? 0) + ($statusCounts['sent'] ?? 0);

            // Calculate Percentages
            $deliveredPct = $totalSentThisMonth > 0 ? round(($deliveredCount / $totalSentThisMonth) * 100) : 0;
            $failedPct = $totalSentThisMonth > 0 ? round(($failedCount / $totalSentThisMonth) * 100) : 0;
            $pendingPct = $totalSentThisMonth > 0 ? round(($pendingCount / $totalSentThisMonth) * 100) : 0;

            // 4. Message Timeline (Last 7 days)
            $last7Days = Message::whereHas('conversation', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->where('sender', 'user')
                ->whereIn('status', ['delivered', 'read'])
                ->where('created_at', '>=', Carbon::now()->subDays(7)->startOfDay())
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->pluck('count', 'date')
                ->toArray();

            $timelineData = [];
            $timelineLabels = [];
            for ($i = 6; $i >= 0; $i--) {
                $dateString = Carbon::now()->subDays($i)->toDateString();
                $timelineLabels[] = Carbon::parse($dateString)->format('d/m');
                $timelineData[] = $last7Days[$dateString] ?? 0;
            }

            $totalDeliveredAllTime = Message::whereHas('conversation', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->where('sender', 'user')
                ->whereIn('status', ['delivered', 'read'])
                ->count();

            return response()->json([
                'stats' => [
                    'connected_numbers' => $connectedNumbers,
                    'total_contacts' => $totalContacts,
                ],
                'delivery_status' => [
                    'hits' => $totalSentThisMonth,
                    'series' => [
                        ['label' => 'Sent', 'value' => 100],
                        ['label' => 'Delivered', 'value' => $deliveredPct],
                        ['label' => 'Failed', 'value' => $failedPct],
                        ['label' => 'Pending', 'value' => $pendingPct],
                    ]
                ],
                'message_timeline' => [
                    'total' => $totalDeliveredAllTime,
                    'growth' => '+12.5%',
                    'data' => $timelineData,
                    'labels' => $timelineLabels,
                ]
            ]);
        });
    }
}
