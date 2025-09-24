import { useState, useEffect, useRef, useCallback } from "react";

interface UseDebouncedSearchProps {
    searchFunction: (query: string) => Promise<any>;
    delay?: number;
    minLength?: number;
}

interface UseDebouncedSearchReturn {
    query: string;
    setQuery: (query: string) => void;
    results: any[];
    isLoading: boolean;
    error: string | null;
    clearResults: () => void;
}

export const useDebouncedSearch = ({
    searchFunction,
    delay = 300,
    minLength = 2,
}: UseDebouncedSearchProps): UseDebouncedSearchReturn => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const debounceRef = useRef<NodeJS.Timeout>();
    const abortControllerRef = useRef<AbortController>();
    const searchFunctionRef = useRef(searchFunction);

    // Keep search function ref up to date
    useEffect(() => {
        searchFunctionRef.current = searchFunction;
    }, [searchFunction]);

    const clearResults = useCallback(() => {
        setResults([]);
        setError(null);
    }, []);

    const performSearch = useCallback(
        async (searchQuery: string) => {
            if (searchQuery.length < minLength) {
                setResults([]);
                setIsLoading(false);
                return;
            }

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create new abort controller
            abortControllerRef.current = new AbortController();

            setIsLoading(true);
            setError(null);

            try {
                const searchResults = await searchFunctionRef.current(
                    searchQuery
                );

                // Only update if this request wasn't cancelled
                if (!abortControllerRef.current.signal.aborted) {
                    setResults(searchResults);
                    setIsLoading(false);
                }
            } catch (err: any) {
                if (!abortControllerRef.current.signal.aborted) {
                    setError(err.message || "Search failed");
                    setResults([]);
                    setIsLoading(false);
                }
            }
        },
        [minLength]
    ); // Remove searchFunction from dependencies

    useEffect(() => {
        // Clear previous timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Clear results if query is too short
        if (query.length < minLength) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        // Set new timeout
        debounceRef.current = setTimeout(() => {
            performSearch(query);
        }, delay);

        // Cleanup function
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, delay, minLength]); // Remove performSearch from dependencies

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        query,
        setQuery,
        results,
        isLoading,
        error,
        clearResults,
    };
};
