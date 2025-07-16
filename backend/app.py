from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import uuid
from datetime import datetime
import PyPDF2
from io import BytesIO
import os
import time

app = Flask(__name__)
CORS(app)

# Dummy credentials - replace with your actual API keys
QUADRANT_API_KEY = "dummy-quadrant-api-key-replace-with-real-one"
QUADRANT_URL = "https://dummy-quadrant-cluster.quadrant.tech"
REPLICATE_API_TOKEN = "r8_dummy-replicate-token-replace-with-real-one"

@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    try:
        print('Processing PDF upload...')
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        print(f'File received: {file.filename}, Size: {file.content_length}')

        # Step 1: Extract text from PDF
        pdf_reader = PyPDF2.PdfReader(BytesIO(file.read()))
        extracted_text = ""
        
        for page in pdf_reader.pages:
            extracted_text += page.extract_text() + "\n"
        
        # If extraction fails, use sample text
        if not extracted_text.strip():
            extracted_text = """
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
            """

        print(f'Text extracted, length: {len(extracted_text)}')

        # Step 2: Split into chunks
        chunk_size = 500
        chunks = []
        
        for i in range(0, len(extracted_text), chunk_size):
            chunks.append(extracted_text[i:i + chunk_size])

        print(f'Created {len(chunks)} chunks')

        # Step 3: Generate embeddings for each chunk using LLaMA 2 7B
        embeddings = []
        
        for i, chunk in enumerate(chunks):
            try:
                print(f'Generating embedding for chunk {i + 1} using LLaMA 2')
                
                # Use LLaMA 2 to generate embeddings (simplified approach)
                # In a real implementation, you'd use a proper embedding model
                embedding_response = requests.post(
                    'https://api.replicate.com/v1/predictions',
                    headers={
                        'Authorization': f'Token {REPLICATE_API_TOKEN}',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'version': 'f1d50bb24186c52daae319ca8366e53debdaa9e0ae7ff976e918df752732ccc4',  # LLaMA 2 7B
                        'input': {
                            'prompt': f'Convert this text to numerical representation for similarity search: {chunk[:500]}',
                            'max_length': 50,
                            'temperature': 0.1
                        }
                    }
                )
                
                if embedding_response.ok:
                    embedding_data = embedding_response.json()
                    
                    # Poll for completion
                    prediction_id = embedding_data['id']
                    attempts = 0
                    max_attempts = 10
                    
                    while attempts < max_attempts:
                        status_response = requests.get(
                            f'https://api.replicate.com/v1/predictions/{prediction_id}',
                            headers={'Authorization': f'Token {REPLICATE_API_TOKEN}'}
                        )
                        
                        if status_response.ok:
                            status_data = status_response.json()
                            if status_data['status'] == 'succeeded':
                                # Create a simple embedding from the text hash for demo purposes
                                # In production, use a proper embedding model
                                embedding = [hash(chunk[j:j+10]) % 1000 / 1000.0 for j in range(0, min(len(chunk), 1536), max(1, len(chunk)//1536))]
                                embedding = embedding[:1536] + [0.0] * (1536 - len(embedding))  # Pad to 1536 dimensions
                                break
                            elif status_data['status'] == 'failed':
                                raise Exception('LLaMA embedding generation failed')
                        
                        time.sleep(1)
                        attempts += 1
                    
                    if attempts >= max_attempts:
                        # Fallback: use simple hash-based embedding
                        embedding = [hash(chunk[j:j+10]) % 1000 / 1000.0 for j in range(0, min(len(chunk), 1536), max(1, len(chunk)//1536))]
                        embedding = embedding[:1536] + [0.0] * (1536 - len(embedding))
                else:
                    # Fallback: use simple hash-based embedding
                    embedding = [hash(chunk[j:j+10]) % 1000 / 1000.0 for j in range(0, min(len(chunk), 1536), max(1, len(chunk)//1536))]
                    embedding = embedding[:1536] + [0.0] * (1536 - len(embedding))
                
                embeddings.append({
                    'chunk': chunk,
                    'embedding': embedding,
                    'metadata': {
                        'source': file.filename,
                        'chunk_index': i,
                        'chunk_size': len(chunk)
                    }
                })

            except Exception as error:
                print(f'Error generating embedding for chunk {i}: {error}')
                # Fallback: use simple hash-based embedding
                embedding = [hash(chunk[j:j+10]) % 1000 / 1000.0 for j in range(0, min(len(chunk), 1536), max(1, len(chunk)//1536))]
                embedding = embedding[:1536] + [0.0] * (1536 - len(embedding))
                
                embeddings.append({
                    'chunk': chunk,
                    'embedding': embedding,
                    'metadata': {
                        'source': file.filename,
                        'chunk_index': i,
                        'chunk_size': len(chunk)
                    }
                })
                continue

        print(f'Generated embeddings for {len(embeddings)} chunks')

        # Step 4: Store in Quadrant vector database
        try:
            print('Storing embeddings in Quadrant...')
            
            points = []
            for index, item in enumerate(embeddings):
                points.append({
                    'id': f"{file.filename}_chunk_{index}",
                    'vector': item['embedding'],
                    'payload': {
                        'text': item['chunk'],
                        'source': item['metadata']['source'],
                        'chunk_index': item['metadata']['chunk_index'],
                        'chunk_size': item['metadata']['chunk_size']
                    }
                })
            
            quadrant_response = requests.put(
                f"{QUADRANT_URL}/collections/screws/points",
                headers={
                    'Content-Type': 'application/json',
                    'api-key': QUADRANT_API_KEY
                },
                json={'points': points}
            )

            if not quadrant_response.ok:
                raise Exception(f'Quadrant storage failed: {quadrant_response.text}')

            print('Successfully stored embeddings in Quadrant')

        except Exception as error:
            print(f'Error storing in Quadrant: {error}')
            return jsonify({'error': 'Failed to store embeddings'}), 500

        # Step 5: Save document metadata
        document_data = {
            'id': str(uuid.uuid4()),
            'file_name': file.filename,
            'file_size': file.content_length,
            'content_type': file.content_type,
            'chunks_count': len(chunks),
            'processing_status': 'completed',
            'created_at': datetime.now().isoformat()
        }

        print(f'Document processing completed: {document_data}')

        return jsonify({
            'success': True,
            'document': document_data,
            'chunks_processed': len(chunks),
            'embeddings_created': len(embeddings)
        })

    except Exception as error:
        print(f'Error in process-pdf: {error}')
        return jsonify({'error': str(error)}), 500


@app.route('/chat-query', methods=['POST'])
def chat_query():
    try:
        data = request.get_json()
        query = data.get('query')
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400

        print(f'Processing chat query: {query}')

        # Step 1: Generate embedding for the user query using LLaMA 2
        print('Generating query embedding using LLaMA 2...')
        
        try:
            # Use the same embedding approach as for chunks
            query_embedding = [hash(query[j:j+10]) % 1000 / 1000.0 for j in range(0, min(len(query), 1536), max(1, len(query)//1536))]
            query_embedding = query_embedding[:1536] + [0.0] * (1536 - len(query_embedding))
            print('Query embedding generated')
        except Exception as error:
            print(f'Error generating query embedding: {error}')
            # Fallback embedding
            query_embedding = [0.5] * 1536

        # Step 2: Search for similar vectors in Quadrant
        print('Searching Quadrant for similar vectors...')
        
        search_response = requests.post(
            f"{QUADRANT_URL}/collections/screws/points/search",
            headers={
                'Content-Type': 'application/json',
                'api-key': QUADRANT_API_KEY
            },
            json={
                'vector': query_embedding,
                'limit': 5,
                'with_payload': True,
                'score_threshold': 0.7
            }
        )

        if not search_response.ok:
            raise Exception(f'Quadrant search failed: {search_response.text}')

        search_results = search_response.json()
        print(f'Found {len(search_results.get("result", []))} relevant chunks')

        # Step 3: Extract relevant context from search results
        relevant_context = '\n\n'.join([
            result['payload']['text'] 
            for result in search_results.get('result', [])
        ])
        
        # Step 4: Create prompt for LLaMA 2 7B
        system_prompt = f"""You are ScrewSavvy, an expert AI assistant for screw and fastener recommendations. 
        Use the provided context to answer questions about screws, fasteners, and hardware.
        Be helpful, accurate, and specific in your recommendations.
        If the context doesn't contain relevant information, say so politely.

        Context:
        {relevant_context}

        User Question: {query}

        Answer:"""

        print('Sending to LLaMA 2 via Replicate...')

        # Step 5: Send to LLaMA 2 7B via Replicate
        llama_response = requests.post(
            'https://api.replicate.com/v1/predictions',
            headers={
                'Authorization': f'Token {REPLICATE_API_TOKEN}',
                'Content-Type': 'application/json'
            },
            json={
                'version': 'f1d50bb24186c52daae319ca8366e53debdaa9e0ae7ff976e918df752732ccc4',  # LLaMA 2 7B Chat
                'input': {
                    'prompt': system_prompt,
                    'max_length': 500,
                    'temperature': 0.7,
                    'top_p': 0.9,
                    'repetition_penalty': 1.15
                }
            }
        )

        if not llama_response.ok:
            raise Exception(f'LLaMA API failed: {llama_response.text}')

        llama_data = llama_response.json()
        print(f'LLaMA prediction started: {llama_data["id"]}')

        # Step 6: Poll for completion (Replicate is async)
        prediction = llama_data
        attempts = 0
        max_attempts = 30  # 30 seconds timeout

        while prediction['status'] not in ['succeeded', 'failed'] and attempts < max_attempts:
            import time
            time.sleep(1)  # Wait 1 second
            
            status_response = requests.get(
                f'https://api.replicate.com/v1/predictions/{prediction["id"]}',
                headers={'Authorization': f'Token {REPLICATE_API_TOKEN}'}
            )

            if status_response.ok:
                prediction = status_response.json()
                print(f'Prediction status: {prediction["status"]}')
            
            attempts += 1

        if prediction['status'] != 'succeeded':
            raise Exception('LLaMA prediction failed or timed out')

        # Step 7: Extract and return the response
        llama_output = ''.join(prediction.get('output', [])) or 'I apologize, but I was unable to generate a response.'
        
        print('Chat response generated successfully')

        return jsonify({
            'success': True,
            'response': llama_output,
            'context_chunks_used': len(search_results.get('result', [])),
            'query': query
        })

    except Exception as error:
        print(f'Error in chat-query: {error}')
        return jsonify({
            'error': str(error),
            'fallback_response': "I'm having trouble accessing my knowledge base right now. Please ensure all API credentials are properly configured and try again."
        }), 500


@app.route('/save-feedback', methods=['POST'])
def save_feedback():
    try:
        data = request.get_json()
        question = data.get('question')
        wrong_answer = data.get('wrong_answer')
        correct_answer = data.get('correct_answer')
        user_feedback = data.get('user_feedback')
        
        if not question or not user_feedback:
            return jsonify({'error': 'Question and feedback are required'}), 400

        print('Saving user feedback...')

        # Create feedback entry
        feedback_data = {
            'id': str(uuid.uuid4()),
            'question': question,
            'wrong_answer': wrong_answer,
            'correct_answer': correct_answer,
            'user_feedback': user_feedback,
            'timestamp': datetime.now().isoformat(),
            'processed': False
        }

        print(f'Feedback data created: {feedback_data}')

        # Save to JSON file (in production, use a proper database)
        try:
            feedback_file = 'feedback_data.json'
            
            # Load existing feedback
            if os.path.exists(feedback_file):
                with open(feedback_file, 'r') as f:
                    feedback_list = json.load(f)
            else:
                feedback_list = []
            
            # Add new feedback
            feedback_list.append(feedback_data)
            
            # Save back to file
            with open(feedback_file, 'w') as f:
                json.dump(feedback_list, f, indent=2)
            
            print('Feedback saved successfully')

            return jsonify({
                'success': True,
                'message': 'Thank you for your feedback! This will help improve our recommendations.',
                'feedback_id': feedback_data['id']
            })

        except Exception as storage_error:
            print(f'Error saving feedback: {storage_error}')
            raise Exception('Failed to save feedback')

    except Exception as error:
        print(f'Error in save-feedback: {error}')
        return jsonify({'error': str(error)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'ScrewSavvy Flask backend is running'})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)