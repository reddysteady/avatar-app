# Technical Specification: RAG Pipeline Integration for AI-Driven Avatar App

## 1. Overview

This document outlines the technical specifications for integrating a Retrieval-Augmented Generation (RAG) pipeline into the existing AI-Driven Avatar app. The RAG system will enhance the avatar's responses by providing relevant context from the influencer's content (primarily YouTube transcripts), enabling more authentic and informed conversations with fans.

### 1.1 Current System

The existing Avatar App currently uses a standard LLM approach for generating responses to user messages, which may lack specific knowledge about the influencer's content. The application integrates with Instagram DMs and YouTube comments, with plans to expand to other platforms.

### 1.2 Integration Goals

1. Enhance response quality by providing influencer-specific context from their content
2. Maintain the influencer's authentic voice and style in responses
3. Create a seamless experience between existing functionality and the new RAG capabilities
4. Enable scalable storage and retrieval of large volumes of influencer content
5. Minimize latency in user interactions while providing more relevant responses

## 2. Technical Architecture

### 2.1 System Components

#### 2.1.1 Data Ingestion Pipeline

- **Content Collection**: System to gather YouTube video transcripts and other content sources
- **Text Processing**: Cleaning, formatting, and chunking content into manageable segments
- **Embedding Generation**: Converting text chunks into vector embeddings
- **Vector Storage**: Storing embeddings and their associated content in Supabase using pgvector

#### 2.1.2 Query Processing System

- **Message Embedding**: Converting user messages into vector embeddings
- **Similarity Search**: Finding relevant content chunks based on embedding similarity
- **Context Assembly**: Packaging retrieved content for the LLM

#### 2.1.3 Response Generation

- **GPT-4o Integration**: Sending user message and retrieved context to OpenAI's GPT-4o
- **Response Formatting**: Processing the LLM response for display

#### 2.1.4 API Layer

- **Endpoint**: Simple REST API for front-end integration
- **Authentication**: Secure access to the RAG pipeline

### 2.2 Architecture Diagram

```
+-------------------+      +------------------+      +------------------------+
|                   |      |                  |      |                        |
|  Frontend         |      |  Backend Server  |      |  Supabase (pgvector)   |
|  (React)          +----->+  (Node.js)       +----->+                        |
|                   |      |                  |      |  - Vector Embeddings   |
+-------------------+      +---------+--------+      |  - Content Chunks      |
                                     |               |                        |
                                     |               +------------------------+
                                     v
                           +---------+--------+
                           |                  |
                           |  OpenAI API      |
                           |  (GPT-4o)        |
                           |                  |
                           +------------------+
```

## 3. Detailed Component Specifications

### 3.1 Data Ingestion Pipeline

#### 3.1.1 Content Collection

- **YouTube Channel Integration**:
  - Allow influencers to provide YouTube channel URL (e.g., https://www.youtube.com/@channelname)
  - Use YouTube Data API to extract all videos from the channel
  - Extract transcripts using YouTube Transcript API
  - Support both auto-generated and manually uploaded transcripts
  - Store metadata (video ID, title, publish date, URL, channel info)
  - Schedule automatic checks for new content (configurable frequency)

- **Instagram Account Integration**:
  - Allow influencers to provide Instagram handle/URL (e.g., @username)
  - Use Instagram Graph API to collect caption text from posts
  - Gather influencer's comments and responses
  - Extract text content from IGTV descriptions
  - Store metadata (post ID, timestamp, engagement metrics)

- **Additional Content Sources** (future expansion):
  - Blog posts
  - Podcast transcripts
  - Other social media accounts
  - FAQ documents

#### 3.1.2 Text Processing

- **Chunking Strategy**:
  - Split content into ~300-word chunks
  - Maintain 50-100 word overlap between chunks for context continuity
  - Preserve metadata association with each chunk

- **Clean-up Process**:
  - Remove timestamps, speaker labels, and irrelevant markers
  - Fix common transcription errors
  - Normalize text formatting

#### 3.1.3 Embedding Generation

- **Embedding Model**:
  - Use OpenAI's `text-embedding-3-small` model (1,536 dimensions)
  - Future option to switch to other embedding models as needed

- **Batch Processing**:
  - Process chunks in batches of 20 for efficiency
  - Implement rate limiting to comply with API restrictions

#### 3.1.4 Vector Storage

- **Supabase Schema**:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table to store content chunks with embeddings
CREATE TABLE influencer_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  embedding VECTOR(1536)
);

-- Create a search function using cosine similarity
CREATE FUNCTION match_embeddings (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
) RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    content,
    metadata,
    1 - (influencer_content.embedding <=> query_embedding) AS similarity
  FROM influencer_content
  WHERE 1 - (influencer_content.embedding <=> query_embedding) > match_threshold
  ORDER BY influencer_content.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create an index for better performance
CREATE INDEX ON influencer_content USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 3.2 Query Processing System

#### 3.2.1 Message Embedding

- **Runtime Embedding**:
  - Convert user messages to embeddings using the same model as content
  - Optimize for low latency (< 300ms for embedding generation)

#### 3.2.2 Similarity Search

- **Search Parameters**:
  - Match threshold: 0.75 (configurable)
  - Match count: 3-5 chunks (configurable)
  - Sort by similarity score

- **Performance Requirements**:
  - Query execution time < 200ms
  - Support for filters based on content metadata

#### 3.2.3 Context Assembly

- **Format**:
  ```
  Context from [video title 1]:
  [Content chunk 1]

  Context from [video title 2]:
  [Content chunk 2]
  ```

- **Size Limits**:
  - Maximum context window: 4,000 tokens
  - Truncation strategy for oversized contexts

### 3.3 Response Generation

#### 3.3.1 GPT-4o Integration

- **Model Parameters**:
  - Model: `gpt-4o`
  - Temperature: 0.7 (configurable)
  - Max tokens: 1,000 (configurable)
  - Top_p: 1.0

- **System Prompt Template**:
  ```
  You are a helpful and energetic avatar of [influencer name]. Respond in the same style and personality as shown in the provided context. Base your knowledge primarily on the context provided, but you can use general knowledge for common topics. If you don't have enough context to answer accurately, acknowledge what you know and don't make up information about the influencer's specific experiences or opinions.
  ```

#### 3.3.2 Response Formatting

- Remove any references to "context provided" in the final response
- Format links, hashtags, and mentions appropriately
- Apply any configured personality adjustments

### 3.4 API Layer

#### 3.4.1 Endpoint Specifications

**Content Source Management**

**POST /api/content_sources**

Request Body:
```json
{
  "influencerId": "influencer_account_id",
  "sourceType": "youtube_channel",
  "sourceUrl": "https://www.youtube.com/@channelname"
}
```

Response Body:
```json
{
  "sourceId": "generated_source_id",
  "status": "processing",
  "estimatedCompletionTime": "2023-05-14T15:30:00Z"
}
```

**GET /api/content_sources**

Request Parameters:
- `influencerId`: ID of the influencer

Response Body:
```json
{
  "sources": [
    {
      "sourceId": "source_id_1",
      "sourceType": "youtube_channel",
      "sourceUrl": "https://www.youtube.com/@channelname",
      "status": "active",
      "contentItems": 42,
      "lastUpdated": "2023-05-13T10:15:00Z"
    },
    {
      "sourceId": "source_id_2",
      "sourceType": "instagram_account",
      "sourceUrl": "https://www.instagram.com/username",
      "status": "active",
      "contentItems": 128,
      "lastUpdated": "2023-05-13T11:30:00Z"
    }
  ]
}
```

**POST /api/refresh_content**

Request Body:
```json
{
  "sourceId": "source_id_to_refresh"
}
```

Response Body:
```json
{
  "status": "processing",
  "estimatedCompletionTime": "2023-05-14T15:45:00Z"
}
```

**RAG Query Endpoint**

**POST /api/query_rag**

Request Body:
```json
{
  "message": "User's message here",
  "userId": "unique_user_identifier",
  "influencerId": "influencer_account_id",
  "conversationId": "optional_conversation_id",
  "sourceFilters": ["youtube", "instagram"] // Optional filters for specific source types
}
```

Response Body:
```json
{
  "response": "AI-generated response with context",
  "sources": [
    {
      "sourceType": "youtube",
      "title": "Video Title",
      "url": "https://youtube.com/watch?v=videoId",
      "relevanceScore": 0.92
    },
    {
      "sourceType": "instagram",
      "contentType": "post",
      "url": "https://instagram.com/p/abcd1234",
      "relevanceScore": 0.85
    }
  ],
  "processingTime": 1.25
}
```

#### 3.4.2 Authentication & Security

- JWT-based authentication
- Rate limiting: 60 requests per minute per user
- Input validation and sanitization
- Content filtering for inappropriate requests

## 4. Integration with Existing System

### 4.1 Frontend Integration

- Update the existing messaging components to use the RAG endpoint
- Add optional "sources" display in the message UI
- Include toggle for RAG-enhanced responses vs. generic responses

### 4.2 Backend Integration

- Extend the existing message processing pipeline to route to RAG endpoint
- Implement fallback to standard LLM if RAG service unavailable
- Add context tracking for multi-turn conversations

## 5. Data Management

### 5.1 Content Refresh Strategy

- **Automated Content Discovery**:
  - YouTube: Automatically detect new videos on connected channels (configurable: daily/weekly)
  - Instagram: Poll for new posts and comments (configurable: hourly/daily)
- **Processing Queue**:
  - Prioritize processing of new content based on recency and engagement metrics
  - Background processing to minimize impact on system performance
- **Content Dashboard**:
  - Provide influencers with visibility into indexed content sources
  - Allow manual triggering of content refresh
  - Display processing status and content coverage metrics

### 5.2 Storage Requirements

- Average YouTube transcript: ~2,000 words = ~7 chunks
- Average embedding storage: 1,536 dimensions * 4 bytes = ~6KB per chunk
- Projected storage for 100 videos: ~700 chunks = ~4.2MB for embeddings + ~2MB for text

## 6. Implementation Plan

### 6.1 Phase 1: Core RAG Infrastructure (2 weeks)

1. Set up Supabase with pgvector extension
2. Implement YouTube channel content extraction:
   - Channel URL parsing and validation
   - YouTube Data API integration for video listing
   - Transcript extraction and processing
3. Implement Instagram account content extraction:
   - Account authentication and API integration
   - Post text and comment collection
4. Develop embedding generation service
5. Create vector storage interface
6. Build content source management API

### 6.2 Phase 2: Integration & Testing (1.5 weeks)

1. Connect RAG API to existing backend
2. Implement automatic content refresh mechanism
3. Create content source management UI
4. Update messaging components
5. Implement authentication and security measures
6. Perform load testing and optimization

### 6.3 Phase 3: Refinement & Enhancement (1.5 weeks)

1. Develop advanced content dashboard for influencers
2. Implement source filtering and relevance tuning
3. Create monitoring and analytics for RAG performance
4. Fine-tune retrieval parameters
5. Implement cross-source context blending
6. Add support for content priority weighting (newer content vs. most relevant)

## 7. Performance Metrics & Monitoring

### 7.1 Key Performance Indicators

- **Retrieval Relevance**: Measure relevance of retrieved chunks (target >85%)
- **Response Latency**: End-to-end response time (target <2 seconds)
- **User Satisfaction**: Feedback on enhanced responses (target >4/5 rating)

### 7.2 Monitoring Plan

- Implement logging for all RAG pipeline stages
- Track embedding generation times
- Monitor query performance and optimization
- Set up alerting for service degradation

## 8. Security & Privacy Considerations

- All API keys and credentials stored in secure environment variables
- Content access controlled by influencer permissions
- User data processed according to privacy policy
- Regular security audits of the vector database access

## 9. Future Enhancements

1. **Multi-modal RAG**: Include image and video content in retrieval
2. **Advanced Context Selection**: Use ML to improve chunk selection
3. **Custom Embedding Models**: Train embedding models on influencer-specific content
4. **Conversational Memory**: Enhance with longer conversation history
5. **Cross-lingual Support**: Handle questions in multiple languages

## 10. Dependencies and Requirements

### 10.1 External Services

- **OpenAI API**: For embeddings and GPT-4o access
- **Supabase**: For vector storage with pgvector
- **YouTube Data API**: For transcript extraction

### 10.2 Environment Requirements

```
NODE_VERSION=18.x
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
YOUTUBE_API_KEY=your_youtube_key
```

## 11. Conclusion

The RAG pipeline integration will significantly enhance the AI-Driven Avatar App by providing context-aware responses based on the influencer's actual content from multiple sources. By supporting direct integration with YouTube channels and Instagram accounts, we enable a seamless content ingestion process that requires minimal manual effort from influencers.

This automated approach ensures the avatar stays current with the influencer's latest content across platforms, creating a more comprehensive knowledge base. The improved authenticity and accuracy will create a more engaging and valuable experience for fans while maintaining the influencer's unique voice and style across different platforms.

The system's ability to automatically discover and process new content will help the avatar evolve alongside the influencer's growing body of work, ensuring long-term relevance and accuracy in fan interactions.

---

**Document Version**: 1.0  
**Last Updated**: 2023-05-13  
**Author**: Emma, Product Manager