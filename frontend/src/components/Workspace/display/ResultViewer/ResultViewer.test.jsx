import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ResultViewer from './ResultViewer';

/**
 * Test suite for the ResultViewer component focusing on
 * async loading states, timeout unmounting, and load events.
 */
describe('ResultViewer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders initial loading state correctly', () => {
    render(<ResultViewer originalImage="orig.jpg" processedImage="proc.jpg" />);
    expect(screen.getByText('Downloading Results...')).toBeInTheDocument();
  });

  it('updates loading text after 3 seconds for standard images', () => {
    render(<ResultViewer originalImage="orig.jpg" processedImage="proc.jpg" />);
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('Wrapping things up. Almost ready...')).toBeInTheDocument();
  });

  it('updates loading text after 3 seconds for high-res images', () => {
    render(<ResultViewer originalImage="orig.jpg" processedImage="proc.jpg" isHighRes={true} />);
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('High-resolution file detected. Almost there...')).toBeInTheDocument();
  });

  it('displays slow connection message after 8 seconds', () => {
    render(<ResultViewer originalImage="orig.jpg" processedImage="proc.jpg" />);
    
    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(screen.getByText('Loading is taking a bit longer than usual. Thanks for your patience!')).toBeInTheDocument();
  });

  it('clears loading state and triggers callback when image loads', () => {
    const onImageLoadMock = vi.fn();
    render(
      <ResultViewer 
        originalImage="orig.jpg" 
        processedImage="proc.jpg" 
        onImageLoad={onImageLoadMock} 
      />
    );

    const processedImg = screen.getByAltText('Processed result');
    
    fireEvent.load(processedImg);

    expect(screen.queryByText(/Downloading/i)).not.toBeInTheDocument();
    expect(onImageLoadMock).toHaveBeenCalledTimes(1);
  });

  it('does not trigger timeouts if image loads quickly', () => {
    render(<ResultViewer originalImage="orig.jpg" processedImage="proc.jpg" />);
    
    const processedImg = screen.getByAltText('Processed result');
    fireEvent.load(processedImg);

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(screen.queryByText(/Thanks for your patience/i)).not.toBeInTheDocument();
  });
});