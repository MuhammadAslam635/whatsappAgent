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
        $range = $request->get('range', 'daily');
        $cacheKey = "user_stats_{$userId}_{$range}";

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($userId, $range) {
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

            $deliveredPct = $totalSentThisMonth > 0 ? round(($deliveredCount / $totalSentThisMonth) * 100) : 0;
            $failedPct = $totalSentThisMonth > 0 ? round(($failedCount / $totalSentThisMonth) * 100) : 0;
            $pendingPct = $totalSentThisMonth > 0 ? round(($pendingCount / $totalSentThisMonth) * 100) : 0;

            // 4. Setup Range Parameters
            $labels = [];
            $startDate = Carbon::now();
            $iterations = 7;
            $format = 'd/m';

            switch ($range) {
                case 'weekly':
                    $startDate = Carbon::now()->subWeeks(4)->startOfWeek();
                    $iterations = 4;
                    $format = '\Ww'; // Week number
                    break;
                case 'monthly':
                    $startDate = Carbon::now()->subMonths(6)->startOfMonth();
                    $iterations = 6;
                    $format = 'M';
                    break;
                case 'yearly':
                    $startDate = Carbon::now()->subYear()->startOfMonth();
                    $iterations = 12;
                    $format = 'M Y';
                    break;
                case 'daily':
                default:
                    $startDate = Carbon::now()->subDays(6)->startOfDay();
                    $iterations = 7;
                    $format = 'd/m';
                    break;
            }

            // 5. Build Interaction and Performance Data
            $interactionData = ['incoming' => [], 'outgoing' => [], 'labels' => []];
            $performanceData = ['sent' => [], 'delivered' => [], 'read' => [], 'failed' => [], 'labels' => []];

            for ($i = 0; $i < $iterations; $i++) {
                $currentStepStart = null;
                $currentStepEnd = null;
                $label = '';

                if ($range === 'weekly') {
                    $currentStepStart = (clone $startDate)->addWeeks($i)->startOfWeek();
                    $currentStepEnd = (clone $currentStepStart)->endOfWeek();
                    $label = "W" . $currentStepStart->weekOfYear;
                } elseif ($range === 'monthly' || $range === 'yearly') {
                    $currentStepStart = (clone $startDate)->addMonths($i)->startOfMonth();
                    $currentStepEnd = (clone $currentStepStart)->endOfMonth();
                    $label = $currentStepStart->format($range === 'yearly' ? 'M y' : 'M');
                } else {
                    $currentStepStart = (clone $startDate)->addDays($i)->startOfDay();
                    $currentStepEnd = (clone $currentStepStart)->endOfDay();
                    $label = $currentStepStart->format('d/m');
                }

                $interactionData['labels'][] = $label;
                $performanceData['labels'][] = $label;

                // Interaction Volume Queries
                $incoming = Message::whereHas('conversation', function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    })
                    ->where('sender', 'contact')
                    ->whereBetween('created_at', [$currentStepStart, $currentStepEnd])
                    ->count();

                $outgoing = Message::whereHas('conversation', function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    })
                    ->where('sender', 'user')
                    ->whereBetween('created_at', [$currentStepStart, $currentStepEnd])
                    ->count();

                $interactionData['incoming'][] = $incoming;
                $interactionData['outgoing'][] = $outgoing;

                // Performance Queries (Status breakdown for outgoing)
                $stats = Message::whereHas('conversation', function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    })
                    ->where('sender', 'user')
                    ->whereBetween('created_at', [$currentStepStart, $currentStepEnd])
                    ->select('status', DB::raw('count(*) as count'))
                    ->groupBy('status')
                    ->pluck('count', 'status')
                    ->toArray();

                $performanceData['sent'][] = ($stats['sent'] ?? 0) + ($stats['pending'] ?? 0);
                $performanceData['delivered'][] = $stats['delivered'] ?? 0;
                $performanceData['read'][] = $stats['read'] ?? 0;
                $performanceData['failed'][] = $stats['failed'] ?? 0;
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
                        ['label' => 'Delivered', 'value' => $deliveredPct],
                        ['label' => 'Pending', 'value' => $pendingPct],
                        ['label' => 'Failed', 'value' => $failedPct],
                    ]

                ],
                'interaction_volume' => $interactionData,
                'bulk_performance' => $performanceData,
                'overall_total' => $totalDeliveredAllTime,
            ]);
        });


    }
}
