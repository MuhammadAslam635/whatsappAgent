<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\RAGService;
use Illuminate\Support\Facades\Log;

class DocumentController extends Controller
{
    protected RAGService $ragService;

    public function __construct(RAGService $ragService)
    {
        $this->ragService = $ragService;
    }

    /**
     * Upload and parse a document into chunks for AI Embeddings
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240', // 10MB max
        ]);

        try {
            // For now assume user ID 1 or get from auth
            $userId = $request->user() ? $request->user()->id : 1;
            
            $file = $request->file('file');
            $result = $this->ragService->processUpload($file, $userId);

            return response()->json([
                'success' => true,
                'message' => 'Document successfully processed and added to AI Knowledge Base.',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            Log::error('Document Upload Failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to process document: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * List all uploaded documents for the user
     */
    public function index(Request $request)
    {
        $userId = $request->user() ? $request->user()->id : 1;
        
        // Get unique document names
        $documents = \Illuminate\Support\Facades\DB::table('document_embeddings')
            ->select('document_name')
            ->selectRaw('MIN(created_at) as uploaded_at')
            ->selectRaw('COUNT(*) as chunks')
            ->where('user_id', $userId)
            ->groupBy('document_name')
            ->orderBy('uploaded_at', 'desc')
            ->get();

        return response()->json($documents);
    }

    /**
     * Delete a document and all its embeddings
     */
    public function destroy(Request $request, $name)
    {
        $userId = $request->user() ? $request->user()->id : 1;
        
        \Illuminate\Support\Facades\DB::table('document_embeddings')
            ->where('user_id', $userId)
            ->where('document_name', $name)
            ->delete();

        return response()->json(['success' => true, 'message' => 'Document deleted successfully.']);
    }
}
