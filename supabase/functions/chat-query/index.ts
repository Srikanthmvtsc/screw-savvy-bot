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
const REPLICATE_API_TOKEN = "r8_dummy-replicate-token-replace-with-real-one";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing chat query:', query);

    // Step 1: Generate embedding for the user query
    console.log('Generating query embedding...');
    
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate query embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('Query embedding generated');

    // Step 2: Search for similar vectors in Quadrant
    console.log('Searching Quadrant for similar vectors...');
    
    const searchResponse = await fetch(`${QUADRANT_URL}/collections/screws/points/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': QUADRANT_API_KEY,
      },
      body: JSON.stringify({
        vector: queryEmbedding,
        limit: 5,
        with_payload: true,
        score_threshold: 0.7
      }),
    });

    if (!searchResponse.ok) {
      throw new Error(`Quadrant search failed: ${searchResponse.statusText}`);
    }

    const searchResults = await searchResponse.json();
    console.log('Found', searchResults.result?.length || 0, 'relevant chunks');

    // Step 3: Extract relevant context from search results
    const relevantContext = searchResults.result?.map((result: any) => result.payload.text).join('\n\n') || '';
    
    // Step 4: Create prompt for LLaMA 2 7B
    const systemPrompt = `You are ScrewSavvy, an expert AI assistant for screw and fastener recommendations. 
    Use the provided context to answer questions about screws, fasteners, and hardware.
    Be helpful, accurate, and specific in your recommendations.
    If the context doesn't contain relevant information, say so politely.

    Context:
    ${relevantContext}

    User Question: ${query}

    Answer:`;

    console.log('Sending to LLaMA 2 via Replicate...');

    // Step 5: Send to LLaMA 2 7B via Replicate
    const llamaResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "f1d50bb24186c52daae319ca8366e53debdaa9e0ae7ff976e918df752732ccc4", // LLaMA 2 7B Chat
        input: {
          prompt: systemPrompt,
          max_length: 500,
          temperature: 0.7,
          top_p: 0.9,
          repetition_penalty: 1.15
        }
      }),
    });

    if (!llamaResponse.ok) {
      throw new Error(`LLaMA API failed: ${llamaResponse.statusText}`);
    }

    const llamaData = await llamaResponse.json();
    console.log('LLaMA prediction started:', llamaData.id);

    // Step 6: Poll for completion (Replicate is async)
    let prediction = llamaData;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        },
      });

      if (statusResponse.ok) {
        prediction = await statusResponse.json();
        console.log('Prediction status:', prediction.status);
      }
      
      attempts++;
    }

    if (prediction.status !== 'succeeded') {
      throw new Error('LLaMA prediction failed or timed out');
    }

    // Step 7: Extract and return the response
    const llamaOutput = prediction.output?.join('') || 'I apologize, but I was unable to generate a response.';
    
    console.log('Chat response generated successfully');

    return new Response(JSON.stringify({
      success: true,
      response: llamaOutput,
      context_chunks_used: searchResults.result?.length || 0,
      query: query
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-query function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallback_response: "I'm having trouble accessing my knowledge base right now. Please ensure all API credentials are properly configured and try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});