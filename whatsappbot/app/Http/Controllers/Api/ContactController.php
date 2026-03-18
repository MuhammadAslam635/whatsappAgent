<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ContactController extends Controller
{
    /**
     * Display a listing of the contacts for the authenticated user.
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');

        $query = $request->user()->contacts()->latest();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage);
    }

    /**
     * Store a newly created contact in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'description' => 'nullable|string',
        ]);

        return $request->user()->contacts()->create($validated);
    }

    /**
     * Display the specified contact.
     */
    public function show(Contact $contact, Request $request)
    {
        if ($contact->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }
        return $contact;
    }

    /**
     * Update the specified contact in storage.
     */
    public function update(Request $request, Contact $contact)
    {
        if ($contact->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone_number' => 'sometimes|required|string|max:20',
            'description' => 'nullable|string',
        ]);

        $contact->update($validated);
        return $contact;
    }

    /**
     * Remove the specified contact from storage.
     */
    public function destroy(Contact $contact, Request $request)
    {
        if ($contact->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }

        $contact->delete();
        return response()->json(['message' => 'Contact deleted successfully']);
    }

    /**
     * Handle bulk upload of contacts via CSV.
     */
    public function bulkStore(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        $data = array_map('str_getcsv', file($path));

        if (empty($data)) {
            return response()->json(['message' => 'The CSV file is empty.'], 422);
        }

        $header = array_shift($data);
        $header = array_map('strtolower', $header);
        
        // Basic mapping for CSV headers
        $nameIndex = array_search('name', $header);
        $phoneIndex = array_search('phone', $header) !== false ? array_search('phone', $header) : array_search('phone_number', $header);

        if ($nameIndex === false || $phoneIndex === false) {
             return response()->json([
                'message' => 'Invalid CSV format. Header must contain "name" and "phone" or "phone_number".'
            ], 422);
        }

        $userId = $request->user()->id;
        $errors = [];
        $addedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($data as $index => $row) {
                if (count($row) <= max($nameIndex, $phoneIndex)) continue;

                $name = trim($row[$nameIndex]);
                $phone = trim($row[$phoneIndex]);

                if (empty($name) || empty($phone)) continue;

                // Validate individual row
                $validator = Validator::make([
                    'name' => $name,
                    'phone_number' => $phone,
                ], [
                    'name' => 'required|string|max:255',
                    'phone_number' => 'required|string|max:20',
                ]);

                if ($validator->fails()) {
                    $errors[] = "Row " . ($index + 2) . ": " . implode(', ', $validator->errors()->all());
                    continue;
                }

                // Use updateOrCreate to avoid duplicates for the same user
                Contact::updateOrCreate(
                    ['user_id' => $userId, 'phone_number' => $phone],
                    ['name' => $name]
                );
                $addedCount++;
            }

            DB::commit();
            return response()->json([
                'message' => "Successfully processed $addedCount contacts.",
                'errors' => $errors,
                'count' => $addedCount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to process bulk upload: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove multiple contacts from storage.
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:contacts,id'
        ]);

        $count = $request->user()->contacts()
            ->whereIn('id', $validated['ids'])
            ->delete();

        return response()->json([
            'message' => "Successfully deleted $count contacts.",
            'count' => $count
        ]);
    }
}
