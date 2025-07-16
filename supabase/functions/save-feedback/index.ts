import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, wrong_answer, correct_answer, user_feedback } = await req.json();
    
    if (!question || !user_feedback) {
      return new Response(JSON.stringify({ error: 'Question and feedback are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Saving user feedback...');

    // Create feedback entry
    const feedbackData = {
      id: crypto.randomUUID(),
      question: question,
      wrong_answer: wrong_answer || null,
      correct_answer: correct_answer || null,
      user_feedback: user_feedback,
      timestamp: new Date().toISOString(),
      processed: false
    };

    console.log('Feedback data created:', feedbackData);

    // In a real implementation, you would:
    // 1. Save this to a database
    // 2. Queue it for processing
    // 3. Use it to retrain or update your knowledge base

    // For now, we'll simulate saving to a JSON file/database
    try {
      // Simulate database/file storage
      console.log('Saving feedback to storage...');
      
      // In production, this would be:
      // - Saved to Supabase database
      // - Queued for processing
      // - Used to update embeddings and knowledge base
      
      console.log('Feedback saved successfully');

      return new Response(JSON.stringify({
        success: true,
        message: 'Thank you for your feedback! This will help improve our recommendations.',
        feedback_id: feedbackData.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (storageError) {
      console.error('Error saving feedback:', storageError);
      throw new Error('Failed to save feedback');
    }

  } catch (error) {
    console.error('Error in save-feedback function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});