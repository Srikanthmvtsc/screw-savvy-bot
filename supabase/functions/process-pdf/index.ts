import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dummy credentials - replace with actual values
const OPENAI_API_KEY = "sk-dummy-openai-api-key-replace-with-real-one";
const QUADRANT_API_KEY = "dummy-quadrant-api-key-replace-with-real-one";
const QUADRANT_URL = "https://dummy-quadrant-cluster.quadrant.tech";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing PDF upload...');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('File received:', file.name, 'Size:', file.size);

    // Step 1: Extract text from PDF (using a simple text extraction simulation)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // In real implementation, you'd use a PDF library like pdf-parse
    // For now, we'll simulate extracted text
    const extractedText = `
    Wood Screws:
    - Use for joining wood pieces
    - Common sizes: #6, #8, #10, #12
    - Lengths: 3/4", 1", 1.25", 1.5", 2", 2.5", 3"
    - Head types: Phillips, Robertson, Torx
    
    Sheet Metal Screws:
    - For metal-to-metal or metal-to-wood connections
    - Self-tapping design
    - Sizes: #6 to #14
    - Lengths: 1/4" to 6"
    
    Drywall Screws:
    - For attaching drywall to studs
    - Fine thread for metal studs
    - Coarse thread for wood studs
    - Bugle head design
    - Phosphate coating prevents rust
    `;

    console.log('Text extracted, length:', extractedText.length);

    // Step 2: Split into chunks
    const chunkSize = 500;
    const chunks: string[] = [];
    
    for (let i = 0; i < extractedText.length; i += chunkSize) {
      chunks.push(extractedText.slice(i, i + chunkSize));
    }

    console.log('Created', chunks.length, 'chunks');

    // Step 3: Generate embeddings for each chunk
    const embeddings = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        console.log('Generating embedding for chunk', i + 1);
        
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: chunk,
          }),
        });

        if (!embeddingResponse.ok) {
          console.error('OpenAI embedding failed for chunk', i);
          continue;
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;
        
        embeddings.push({
          chunk: chunk,
          embedding: embedding,
          metadata: {
            source: file.name,
            chunk_index: i,
            chunk_size: chunk.length
          }
        });

      } catch (error) {
        console.error('Error generating embedding for chunk', i, error);
      }
    }

    console.log('Generated embeddings for', embeddings.length, 'chunks');

    // Step 4: Store in Quadrant vector database
    try {
      console.log('Storing embeddings in Quadrant...');
      
      const quadrantResponse = await fetch(`${QUADRANT_URL}/collections/screws/points`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-key': QUADRANT_API_KEY,
        },
        body: JSON.stringify({
          points: embeddings.map((item, index) => ({
            id: `${file.name}_chunk_${index}`,
            vector: item.embedding,
            payload: {
              text: item.chunk,
              source: item.metadata.source,
              chunk_index: item.metadata.chunk_index,
              chunk_size: item.metadata.chunk_size
            }
          }))
        }),
      });

      if (!quadrantResponse.ok) {
        throw new Error(`Quadrant storage failed: ${quadrantResponse.statusText}`);
      }

      console.log('Successfully stored embeddings in Quadrant');

    } catch (error) {
      console.error('Error storing in Quadrant:', error);
      return new Response(JSON.stringify({ error: 'Failed to store embeddings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 5: Save document metadata (simulate database storage)
    const documentData = {
      id: crypto.randomUUID(),
      file_name: file.name,
      file_size: file.size,
      content_type: file.type,
      chunks_count: chunks.length,
      processing_status: 'completed',
      created_at: new Date().toISOString()
    };

    console.log('Document processing completed:', documentData);

    return new Response(JSON.stringify({
      success: true,
      document: documentData,
      chunks_processed: chunks.length,
      embeddings_created: embeddings.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-pdf function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});