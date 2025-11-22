/**
 * Parallel execution utilities with concurrency control
 * Prevents overwhelming external APIs with too many simultaneous requests
 */

/**
 * Execute async tasks in parallel with a concurrency limit
 *
 * @param tasks - Array of async functions to execute
 * @param concurrency - Maximum number of tasks to run simultaneously
 * @returns Promise with array of results
 */
export async function parallelLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = 3
): Promise<T[]> {
  const results: T[] = []
  const executing: Set<Promise<void>> = new Set()

  for (const [index, task] of tasks.entries()) {
    const promise = task().then(result => {
      results[index] = result
    }).finally(() => {
      executing.delete(promise)
    })

    executing.add(promise)

    if (executing.size >= concurrency) {
      await Promise.race(executing)
    }
  }

  await Promise.all(Array.from(executing))
  return results
}

/**
 * Execute async tasks in batches with delay between batches
 *
 * @param tasks - Array of async functions to execute
 * @param batchSize - Number of tasks per batch
 * @param delayMs - Delay between batches in milliseconds
 * @returns Promise with array of results
 */
export async function batchWithDelay<T>(
  tasks: (() => Promise<T>)[],
  batchSize: number = 5,
  delayMs: number = 1000
): Promise<T[]> {
  const results: T[] = []

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(task => task()))
    results.push(...batchResults)

    // Add delay between batches (except after the last batch)
    if (i + batchSize < tasks.length) {
      await delay(delayMs)
    }
  }

  return results
}

/**
 * Simple delay utility
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds (will be doubled each retry)
 * @returns Promise with function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        const delayMs = baseDelay * Math.pow(2, attempt)
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms`)
        await delay(delayMs)
      }
    }
  }

  throw lastError!
}
