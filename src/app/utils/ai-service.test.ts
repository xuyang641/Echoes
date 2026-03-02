import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from './ai-service';

// Hoist the mock function so it's available in the factory
const { mockCreate } = vi.hoisted(() => {
  return { mockCreate: vi.fn() };
});

vi.mock('openai', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

describe('AIService', () => {
  let service: AIService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Initialize with a mock key
    service = new AIService('test-key');
  });

  it('should be configured when key is provided', () => {
    expect(service.isConfigured()).toBe(true);
  });

  it('should generate response using OpenAI', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Test response' } }],
    });

    const response = await service.generateResponse('Hello', []);
    expect(response).toBe('Test response');
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'qwen-plus',
      messages: expect.arrayContaining([
        expect.objectContaining({ role: 'user' })
      ])
    }));
  });

  it('should handle API errors gracefully', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API Error'));
    const response = await service.generateResponse('Hello', []);
    expect(response).toContain('having trouble connecting');
  });
});
