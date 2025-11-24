import { WsException } from '@nestjs/websockets';
import { WsExceptionFilter, AllExceptionsFilter } from './ws-exception.filter';
import { ArgumentsHost } from '@nestjs/common';

describe('WsExceptionFilter', () => {
  let filter: WsExceptionFilter;
  let mockClient: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new WsExceptionFilter();
    mockClient = {
      emit: jest.fn(),
    };
    mockHost = {
      switchToWs: jest.fn().mockReturnValue({
        getClient: () => mockClient,
      }),
    } as any;
  });

  it('should emit error with message string', () => {
    const exception = new WsException('Test error');
    filter.catch(exception, mockHost);

    expect(mockClient.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message: 'Test error',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should emit error with object', () => {
    const errorObject = { message: 'Test error', code: 400 };
    const exception = new WsException(errorObject);
    filter.catch(exception, mockHost);

    expect(mockClient.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message: 'Test error',
        code: 400,
        timestamp: expect.any(String),
      }),
    );
  });
});

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockClient: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockClient = {
      emit: jest.fn(),
    };
    mockHost = {
      switchToWs: jest.fn().mockReturnValue({
        getClient: () => mockClient,
      }),
    } as any;
  });

  it('should catch Error instances', () => {
    const error = new Error('Test error');
    filter.catch(error, mockHost);

    expect(mockClient.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message: 'Test error',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should handle non-Error exceptions', () => {
    const error = 'string error';
    filter.catch(error, mockHost);

    expect(mockClient.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message: 'Internal server error',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should handle null exceptions', () => {
    filter.catch(null, mockHost);

    expect(mockClient.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message: 'Internal server error',
        timestamp: expect.any(String),
      }),
    );
  });
});
